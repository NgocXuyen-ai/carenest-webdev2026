import logging
import re
import time
from datetime import datetime, timedelta
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from config import settings
from database import execute_query
from prompts.sql_prompt import get_system_prompt
from schemas.chat_schemas import ChatRequest, ChatResponse
from services import conversation_service
from services.context_builder import build_answer_context, build_contextual_message
from utils.sql_safety import validate_sql

logger = logging.getLogger(__name__)

_llm: Optional[ChatAnthropic] = None

# Conversations idle longer than this are auto-expired
_CONVERSATION_TIMEOUT_MINUTES = 30


def _get_llm() -> ChatAnthropic:
    global _llm
    if _llm is None:
        _llm = ChatAnthropic(
            model=settings.SQL_MODEL,
            anthropic_api_url=settings.PROXY_BASE_URL,
            anthropic_api_key=settings.PROXY_API_KEY,
            max_tokens=2048,
            timeout=settings.LLM_TIMEOUT,
            max_retries=settings.LLM_MAX_RETRIES,
        )
    return _llm


def _extract_sql(text: str) -> Optional[str]:
    """Extract SQL from ```sql ... ``` code block in LLM response."""
    match = re.search(r"```sql\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    # Fallback: bare SELECT block
    match = re.search(r"(SELECT\s.+)", text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip().split("```")[0].strip()
    return None


def _is_expired(updated_at) -> bool:
    """Return True if the conversation has been idle beyond the timeout."""
    if updated_at is None:
        return False
    # updated_at may be an ISO string (from execute_query serialization)
    if isinstance(updated_at, str):
        try:
            updated_at = datetime.fromisoformat(updated_at)
        except ValueError:
            return False
    threshold = datetime.now() - timedelta(minutes=_CONVERSATION_TIMEOUT_MINUTES)
    # Strip timezone info for comparison if present
    if hasattr(updated_at, "tzinfo") and updated_at.tzinfo is not None:
        threshold = threshold.replace(tzinfo=updated_at.tzinfo)
    return updated_at < threshold


def _get_previous_reply(history: list[dict]) -> Optional[str]:
    """Return the last assistant text reply from history (truncated)."""
    for msg in reversed(history):
        if msg["sender"] == "assistant" and msg["message_type"] == "text":
            return msg["content"][:200]
    return None


def _save_assistant_response(
    conversation_id: int,
    sql: Optional[str],
    reply: str,
    status: str,
    execution_time: float,
) -> Optional[int]:
    """
    Persist SQL message, reply message, and request log.
    Returns the message_id of the reply message (or None on failure).
    """
    try:
        request_id = conversation_service.save_request_log(
            feature_type="chat",
            output_raw=reply,
            status=status,
            provider=settings.SQL_MODEL,
            execution_time=execution_time,
        )

        if sql:
            conversation_service.save_message(
                conversation_id=conversation_id,
                request_id=request_id,
                sender="assistant",
                message_type="sql_query",
                content=sql,
            )

        message_id = conversation_service.save_message(
            conversation_id=conversation_id,
            request_id=request_id,
            sender="assistant",
            message_type="text" if status == "success" else "error",
            content=reply,
        )
        return message_id
    except Exception as e:
        logger.error(f"Failed to save assistant response: {e}")
        return None


def _llm_judge_sql(user_message: str, user_id: int, sql: str) -> tuple[bool, str]:
    """
    Ask LLM to verify the generated SQL is relevant and tenant-scoped.
    Fail-open: if judge itself errors, allow the query (log the error).
    """
    import json as _json
    llm = _get_llm()
    prompt = f"""Bạn là security reviewer. Kiểm tra câu SQL có đạt đủ 3 tiêu chí:
1. Trả lời đúng câu hỏi của user
2. Lọc dữ liệu theo user_id = {user_id} (trực tiếp hoặc qua JOIN health_profile)
3. Không trả về dữ liệu nhạy cảm không liên quan đến yêu cầu

Câu hỏi: {user_message}
SQL: {sql}

Chỉ trả lời JSON (không có text khác):
{{"ok": true}} nếu đạt
{{"ok": false, "reason": "lý do ngắn bằng tiếng Việt"}} nếu không đạt"""

    try:
        resp = llm.invoke([HumanMessage(content=prompt)])
        raw = resp.content.strip()
        # Strip markdown code block if present
        if raw.startswith("```"):
            raw = re.sub(r"```[a-z]*\n?", "", raw).strip().rstrip("```")
        data = _json.loads(raw)
        if data.get("ok"):
            return True, ""
        return False, data.get("reason", "SQL không hợp lệ theo đánh giá bảo mật")
    except Exception as e:
        logger.warning(f"LLM judge failed (fail-open): {e}")
        return True, ""  # Fail-open: don't break service if judge errors


def process_chat(request: ChatRequest) -> ChatResponse:
    start_time = time.time()
    llm = _get_llm()

    # ── Step 1: Resolve conversation ──────────────────────────────────────────
    conversation_id = request.conversation_id

    if conversation_id:
        conv = conversation_service.get_conversation(conversation_id, request.user_id)
        if not conv:
            conversation_id = None  # Not found or wrong user → start fresh
        elif conv["status"] == "closed":
            conversation_id = None  # Closed → start fresh
        elif _is_expired(conv.get("updated_at")):
            conversation_service.close_conversation(conversation_id)
            conversation_id = None  # Expired → close old, start fresh

    if not conversation_id:
        conversation_id = conversation_service.create_conversation(
            user_id=request.user_id,
            title=request.message[:100],
        )

    # ── Step 2: Save user message ─────────────────────────────────────────────
    user_message_id: Optional[int] = None
    try:
        user_message_id = conversation_service.save_message(
            conversation_id=conversation_id,
            request_id=None,
            sender="user",
            message_type="text",
            content=request.message,
        )
    except Exception as e:
        logger.error(f"Failed to save user message: {e}")

    # ── Step 3: Load history & build contextual message ───────────────────────
    history: list[dict] = []
    try:
        all_history = conversation_service.get_recent_history(conversation_id, limit=10)
        # Exclude the message we just saved (filter by ID, not content)
        history = [m for m in all_history if m["message_id"] != user_message_id]
    except Exception as e:
        logger.error(f"Failed to load history: {e}")

    contextual_message = build_contextual_message(history, request.message)

    # ── Step 4: Generate SQL ──────────────────────────────────────────────────
    system_prompt = get_system_prompt(request.user_id)

    try:
        response1 = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=contextual_message),
        ])
        response_text = response1.content
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        reply = "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu. Vui lòng thử lại."
        msg_id = _save_assistant_response(conversation_id, None, reply, "error", time.time() - start_time)
        conversation_service.touch_conversation(conversation_id)
        return ChatResponse(reply=reply, conversation_id=conversation_id, message_id=msg_id)

    sql = _extract_sql(response_text)

    # No SQL → LLM answered directly (general question or off-topic)
    if not sql:
        msg_id = _save_assistant_response(conversation_id, None, response_text, "success", time.time() - start_time)
        conversation_service.touch_conversation(conversation_id)
        return ChatResponse(reply=response_text, conversation_id=conversation_id, message_id=msg_id)

    # ── Step 5: Validate & execute SQL ───────────────────────────────────────
    is_safe, error_msg = validate_sql(sql)
    if not is_safe:
        reply = f"Xin lỗi, tôi không thể thực hiện yêu cầu này: {error_msg}"
        msg_id = _save_assistant_response(conversation_id, sql, reply, "error", time.time() - start_time)
        conversation_service.touch_conversation(conversation_id)
        return ChatResponse(reply=reply, conversation_id=conversation_id, message_id=msg_id, sql_generated=sql)

    # ── Step 5b: LLM judge ────────────────────────────────────────────────────
    is_valid, reason = _llm_judge_sql(request.message, request.user_id, sql)
    if not is_valid:
        reply = f"Xin lỗi, tôi không thể thực hiện yêu cầu này: {reason}"
        msg_id = _save_assistant_response(conversation_id, sql, reply, "error", time.time() - start_time)
        conversation_service.touch_conversation(conversation_id)
        return ChatResponse(reply=reply, conversation_id=conversation_id, message_id=msg_id, sql_generated=sql)

    try:
        # Inject LIMIT nếu SQL chưa có, tránh materialize toàn bộ result set
        if not re.search(r'\bLIMIT\b', sql, re.IGNORECASE):
            sql = sql.rstrip(';').rstrip() + '\nLIMIT 50'
        rows = execute_query(sql)
    except Exception:
        reply = "Không tìm thấy dữ liệu phù hợp hoặc có lỗi khi truy vấn cơ sở dữ liệu."
        msg_id = _save_assistant_response(conversation_id, sql, reply, "error", time.time() - start_time)
        conversation_service.touch_conversation(conversation_id)
        return ChatResponse(reply=reply, conversation_id=conversation_id, message_id=msg_id, sql_generated=sql)

    rows_preview = rows

    # ── Step 6: Generate Vietnamese answer ───────────────────────────────────
    previous_reply = _get_previous_reply(history)
    result_prompt = build_answer_context(previous_reply, request.message, rows_preview)

    try:
        response2 = llm.invoke([HumanMessage(content=result_prompt)])
        final_reply = response2.content
    except Exception:
        final_reply = f"Tìm thấy {len(rows)} kết quả." if rows else "Không tìm thấy dữ liệu phù hợp."

    # ── Step 7: Save everything & return ─────────────────────────────────────
    msg_id = _save_assistant_response(conversation_id, sql, final_reply, "success", time.time() - start_time)
    conversation_service.touch_conversation(conversation_id)

    return ChatResponse(
        reply=final_reply,
        conversation_id=conversation_id,
        message_id=msg_id,
        sql_generated=sql,
        data=rows_preview if rows_preview else None,
    )
