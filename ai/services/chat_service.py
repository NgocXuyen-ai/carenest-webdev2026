import json
import logging
import time
from datetime import datetime, timedelta
from typing import Annotated, Any, Optional, TypedDict
from uuid import uuid4

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from config import settings
from database import execute_query
from prompts.chat_prompts import (
    build_answer_synthesis_prompt,
    build_context_answer_prompt,
    build_response_guard_prompt,
    build_router_prompt,
    build_small_talk_prompt,
    build_sql_generation_prompt,
)
from schemas.chat_schemas import ChatRequest, ChatResponse
from services import conversation_service
from services.context_builder import build_contextual_message

logger = logging.getLogger(__name__)

_llm: Optional[ChatAnthropic] = None
_router_llm: Optional[Any] = None
_chat_graph: Optional[Any] = None
_CONVERSATION_TIMEOUT_MINUTES = 30
_MAX_SQL_ROWS = 50


@tool("route_small_talk")
def route_small_talk(reason: str = "", confidence: float = 0.65) -> str:
    """Route to small talk lane."""
    _trace_tool_invocation("route_small_talk", reason, confidence)
    payload = {
        "route": "small_talk",
        "reason": reason or "General conversational intent.",
        "confidence": confidence,
    }
    return json.dumps(payload, ensure_ascii=False)


@tool("route_context_answer")
def route_context_answer(reason: str = "", confidence: float = 0.65) -> str:
    """Route to context-based answer lane (no SQL generation)."""
    _trace_tool_invocation("route_context_answer", reason, confidence)
    payload = {
        "route": "context_answer",
        "reason": reason or "Can be answered from existing context.",
        "confidence": confidence,
    }
    return json.dumps(payload, ensure_ascii=False)


@tool("route_text_to_sql")
def route_text_to_sql(reason: str = "", confidence: float = 0.65) -> str:
    """Route to text-to-SQL lane."""
    _trace_tool_invocation("route_text_to_sql", reason, confidence)
    payload = {
        "route": "text_to_sql",
        "reason": reason or "Needs data query from database.",
        "confidence": confidence,
    }
    return json.dumps(payload, ensure_ascii=False)


@tool("route_clarify")
def route_clarify(reason: str = "", confidence: float = 0.65) -> str:
    """Route to clarification lane."""
    _trace_tool_invocation("route_clarify", reason, confidence)
    payload = {
        "route": "clarify",
        "reason": reason or "Need additional detail before answering safely.",
        "confidence": confidence,
    }
    return json.dumps(payload, ensure_ascii=False)


@tool("route_refuse")
def route_refuse(reason: str = "", confidence: float = 0.65) -> str:
    """Route to refusal lane."""
    _trace_tool_invocation("route_refuse", reason, confidence)
    payload = {
        "route": "refuse",
        "reason": reason or "Request is unsafe or out of supported domain.",
        "confidence": confidence,
    }
    return json.dumps(payload, ensure_ascii=False)


ROUTE_TOOLS = [
    route_small_talk,
    route_context_answer,
    route_text_to_sql,
    route_clarify,
    route_refuse,
]


class ChatGraphState(TypedDict, total=False):
    trace_id: str
    messages: Annotated[list[AnyMessage], add_messages]
    request: ChatRequest
    start_time: float
    conversation_id: int
    user_message_id: Optional[int]
    history: list[dict[str, Any]]
    route: str
    route_reason: str
    route_confidence: float
    safety_decision: str
    safety_reason: str
    sql: Optional[str]
    rows: list[dict[str, Any]]
    reply: str
    status: str
    error: Optional[str]
    data: Optional[list[Any]]
    message_id: Optional[int]


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


def _get_router_llm() -> Any:
    global _router_llm
    if _router_llm is None:
        _router_llm = _get_llm().bind_tools(ROUTE_TOOLS, tool_choice="any")
    return _router_llm


def _normalize_confidence(value: Any, default: float = 0.5) -> float:
    try:
        confidence = float(value)
    except Exception:
        confidence = default
    return max(0.0, min(1.0, confidence))


def _content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
                continue
            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "\n".join(parts).strip()

    return str(content).strip()


def _preview_text(text: Any, limit: Optional[int] = None) -> str:
    if text is None:
        return ""

    value = str(text)
    max_chars = limit if isinstance(limit, int) and limit > 0 else settings.AI_TRACE_MAX_PREVIEW_CHARS
    max_chars = max(80, max_chars)
    if len(value) <= max_chars:
        return value
    return value[:max_chars] + " ...(truncated)"


def _serialize_payload_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (int, float, bool)):
        return value
    if isinstance(value, str):
        return _preview_text(value)
    if isinstance(value, (dict, list, tuple, set)):
        try:
            encoded = json.dumps(value, ensure_ascii=False, default=str)
        except Exception:
            encoded = str(value)
        return _preview_text(encoded)
    return _preview_text(str(value))


def _emit_trace_line(message: str) -> None:
    logger.info(message)
    if settings.AI_TRACE_PRINT_STDOUT:
        print(message, flush=True)


def _trace_tool_invocation(tool_name: str, reason: str, confidence: float) -> None:
    if not settings.AI_TRACE_ENABLED:
        return
    _emit_trace_line(
        f"[AI_TRACE_TOOL] tool={tool_name} reason={_preview_text(reason)} confidence={confidence}"
    )


def _trace(state: Optional[ChatGraphState], stage: str, **payload: Any) -> None:
    if not settings.AI_TRACE_ENABLED:
        return

    trace_id = "n/a"
    if isinstance(state, dict):
        trace_id = str(state.get("trace_id") or trace_id)

    normalized_payload = {
        key: _serialize_payload_value(value)
        for key, value in payload.items()
    }
    encoded_payload = json.dumps(normalized_payload, ensure_ascii=False, default=str)
    _emit_trace_line(
        f"[AI_TRACE] trace_id={trace_id} stage={stage} payload={encoded_payload}"
    )


def _trace_prompt(state: Optional[ChatGraphState], stage: str, prompt: str) -> None:
    if settings.AI_TRACE_LOG_PROMPTS:
        _trace(state, stage, prompt=prompt)


def _summarize_tool_calls(tool_calls: Any) -> list[dict[str, Any]]:
    if not isinstance(tool_calls, list):
        return []

    result: list[dict[str, Any]] = []
    for call in tool_calls:
        if not isinstance(call, dict):
            continue
        result.append(
            {
                "id": call.get("id"),
                "name": call.get("name"),
                "args": call.get("args"),
            }
        )
    return result


def _extract_first_json_object(text: str) -> Optional[dict[str, Any]]:
    raw = text.strip()
    if raw.startswith("```"):
        lines = [line for line in raw.splitlines() if not line.strip().startswith("```")]
        raw = "\n".join(lines).strip()

    depth = 0
    start = -1
    in_string = False
    escaped = False

    for idx, ch in enumerate(raw):
        if escaped:
            escaped = False
            continue

        if ch == "\\":
            escaped = True
            continue

        if ch == '"':
            in_string = not in_string
            continue

        if in_string:
            continue

        if ch == "{":
            if depth == 0:
                start = idx
            depth += 1
            continue

        if ch == "}":
            if depth == 0:
                continue
            depth -= 1
            if depth == 0 and start >= 0:
                candidate = raw[start : idx + 1]
                try:
                    parsed = json.loads(candidate)
                    if isinstance(parsed, dict):
                        return parsed
                except Exception:
                    return None

    return None


def _is_expired(updated_at: Any) -> bool:
    if updated_at is None:
        return False
    if isinstance(updated_at, str):
        try:
            updated_at = datetime.fromisoformat(updated_at)
        except ValueError:
            return False

    threshold = datetime.now() - timedelta(minutes=_CONVERSATION_TIMEOUT_MINUTES)
    if hasattr(updated_at, "tzinfo") and updated_at.tzinfo is not None:
        threshold = threshold.replace(tzinfo=updated_at.tzinfo)
    return updated_at < threshold


def _normalize_route(raw_route: str) -> str:
    route = (raw_route or "").strip().lower()
    route = route.replace("route_", "")
    allowed = {"small_talk", "context_answer", "text_to_sql", "clarify", "refuse"}
    if route in allowed:
        return route
    return "clarify"


def _get_previous_reply(history: list[dict[str, Any]]) -> Optional[str]:
    for msg in reversed(history):
        if msg.get("sender") == "AI" and msg.get("message_type") == "TEXT":
            content = msg.get("content")
            if isinstance(content, str) and content.strip():
                return content[:240]
    return None


def _ensure_limit(sql: str, limit: int = _MAX_SQL_ROWS) -> str:
    normalized = " ".join(sql.lower().split())
    if " limit " in f" {normalized} ":
        return sql
    return sql.rstrip().rstrip(";") + f"\nLIMIT {limit}"


def _save_assistant_response(
    conversation_id: int,
    sql: Optional[str],
    reply: str,
    status: str,
    execution_time: float,
) -> Optional[int]:
    try:
        request_id = conversation_service.save_request_log(
            feature_type="CHAT",
            output_raw=reply,
            status=status,
            provider=settings.SQL_MODEL,
            execution_time=execution_time,
        )

        if sql:
            conversation_service.save_message(
                conversation_id=conversation_id,
                request_id=request_id,
                sender="AI",
                message_type="SQL_QUERY",
                content=sql,
            )

        message_type = "TEXT" if status == "success" else "ERROR"
        return conversation_service.save_message(
            conversation_id=conversation_id,
            request_id=request_id,
            sender="AI",
            message_type=message_type,
            content=reply,
        )
    except Exception as exc:
        logger.error("Failed to save assistant response: %s", exc)
        return None


def _invoke_json_prompt(
    prompt: str,
    *,
    state: Optional[ChatGraphState] = None,
    stage: str = "json_prompt",
) -> dict[str, Any]:
    _trace_prompt(state, f"{stage}.prompt", prompt)
    try:
        llm = _get_llm()
        response = llm.invoke([HumanMessage(content=prompt)])
    except Exception as exc:
        logger.warning("JSON prompt invoke failed: %s", exc)
        _trace(state, f"{stage}.error", error=str(exc))
        return {}

    raw_text = _content_to_text(response.content)
    parsed = _extract_first_json_object(raw_text) or {}
    _trace(
        state,
        f"{stage}.result",
        parsed=parsed,
        raw_preview=raw_text if settings.AI_TRACE_LOG_PROMPTS else None,
    )
    return parsed


def _node_bootstrap(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    trace_id = str(state.get("trace_id") or f"chat-{uuid4().hex[:8]}")
    conversation_id = request.conversation_id
    conversation_reused = False

    _trace(
        {"trace_id": trace_id},
        "bootstrap.start",
        user_id=request.user_id,
        conversation_id=conversation_id,
        message=request.message,
        context_keys=sorted(request.context.keys()) if isinstance(request.context, dict) else None,
    )

    if conversation_id:
        conv = conversation_service.get_conversation(conversation_id, request.user_id)
        if not conv:
            conversation_id = None
        elif str(conv.get("status")).upper() == "CLOSED":
            conversation_id = None
        elif _is_expired(conv.get("updated_at")):
            conversation_service.close_conversation(conversation_id)
            conversation_id = None
        else:
            conversation_reused = True

    if not conversation_id:
        conversation_id = conversation_service.create_conversation(
            user_id=request.user_id,
            title=request.message[:100],
        )

    user_message_id: Optional[int] = None
    try:
        user_message_id = conversation_service.save_message(
            conversation_id=conversation_id,
            request_id=None,
            sender="USER",
            message_type="TEXT",
            content=request.message,
        )
    except Exception as exc:
        logger.error("Failed to save user message: %s", exc)

    history: list[dict[str, Any]] = []
    try:
        all_history = conversation_service.get_recent_history(conversation_id, limit=10)
        history = [m for m in all_history if m.get("message_id") != user_message_id]
    except Exception as exc:
        logger.error("Failed to load history: %s", exc)

    _trace(
        {"trace_id": trace_id},
        "bootstrap.done",
        conversation_id=conversation_id,
        conversation_reused=conversation_reused,
        user_message_id=user_message_id,
        history_size=len(history),
    )

    return {
        "trace_id": trace_id,
        "conversation_id": conversation_id,
        "user_message_id": user_message_id,
        "history": history,
        "route": "clarify",
        "route_reason": "",
        "route_confidence": 0.0,
        "safety_decision": "allow",
        "safety_reason": "",
        "status": "success",
        "sql": None,
        "rows": [],
        "data": None,
    }


def _node_router_llm(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    prompt = build_router_prompt(request.message, state.get("history", []), request.context)
    _trace_prompt(state, "router_llm.prompt", prompt)
    try:
        router = _get_router_llm()
        ai_message = router.invoke([HumanMessage(content=prompt)])
        if not getattr(ai_message, "tool_calls", None):
            retry_prompt = (
                "Bạn chưa gọi route tool ở lần trả lời trước. "
                "Hãy gọi chính xác một route tool ngay bây giờ.\n\n"
                + prompt
            )
            _trace_prompt(state, "router_llm.retry_prompt", retry_prompt)
            ai_message = router.invoke([HumanMessage(content=retry_prompt)])
    except Exception as exc:
        logger.warning("Router LLM failed, switching to fallback route: %s", exc)
        _trace(state, "router_llm.error", error=str(exc))
        return {"messages": []}
    _trace(
        state,
        "router_llm.output",
        tool_calls=_summarize_tool_calls(getattr(ai_message, "tool_calls", None)),
        content_preview=_content_to_text(ai_message.content),
    )
    return {"messages": [ai_message]}


def _has_route_tool_call(state: ChatGraphState) -> str:
    messages = state.get("messages", [])
    if messages:
        last = messages[-1]
        if isinstance(last, AIMessage) and getattr(last, "tool_calls", None):
            names = {tc.get("name") for tc in last.tool_calls if isinstance(tc, dict)}
            expected_names = {t.name for t in ROUTE_TOOLS}
            if names.intersection(expected_names):
                _trace(state, "router_llm.branch", branch="tool", tool_names=sorted(names))
                return "tool"
            _trace(state, "router_llm.branch", branch="fallback", tool_names=sorted(names))
            return "fallback"
    _trace(state, "router_llm.branch", branch="fallback", reason="no_tool_call")
    return "fallback"


def _node_route_fallback(state: ChatGraphState) -> ChatGraphState:
    messages = state.get("messages", [])
    if not messages:
        _trace(state, "route_fallback.empty")
        return {
            "route": "clarify",
            "route_reason": "Router did not return a decision.",
            "route_confidence": 0.0,
        }

    last = messages[-1]
    text = _content_to_text(last.content) if isinstance(last, AIMessage) else ""
    parsed = _extract_first_json_object(text) or {}
    route = _normalize_route(str(parsed.get("route", "clarify")))
    reason = str(parsed.get("reason", "Router fallback was used.")).strip()
    confidence = _normalize_confidence(parsed.get("confidence", 0.4), default=0.4)
    _trace(
        state,
        "route_fallback.parsed",
        parsed=parsed,
        selected_route=route,
        route_reason=reason,
        route_confidence=confidence,
    )
    return {"route": route, "route_reason": reason, "route_confidence": confidence}


def _node_capture_route(state: ChatGraphState) -> ChatGraphState:
    messages = state.get("messages", [])
    for message in reversed(messages):
        if isinstance(message, ToolMessage):
            parsed = _extract_first_json_object(_content_to_text(message.content)) or {}
            route = _normalize_route(str(parsed.get("route", "clarify")))
            reason = str(parsed.get("reason", "Route selected by tool call.")).strip()
            confidence = _normalize_confidence(parsed.get("confidence", 0.6), default=0.6)
            _trace(
                state,
                "capture_route.tool_message",
                tool_name=getattr(message, "name", None),
                parsed=parsed,
                selected_route=route,
                route_reason=reason,
                route_confidence=confidence,
            )
            return {"route": route, "route_reason": reason, "route_confidence": confidence}

    _trace(state, "capture_route.missing_tool_message")
    return {}


def _select_lane(state: ChatGraphState) -> str:
    route = state.get("route", "clarify")
    if route == "small_talk":
        _trace(state, "lane.select", route=route, lane="small_talk_lane")
        return "small_talk_lane"
    if route == "context_answer":
        _trace(state, "lane.select", route=route, lane="context_answer_lane")
        return "context_answer_lane"
    if route == "text_to_sql":
        _trace(state, "lane.select", route=route, lane="text_to_sql_lane")
        return "text_to_sql_lane"
    if route == "refuse":
        _trace(state, "lane.select", route=route, lane="refuse_lane")
        return "refuse_lane"
    _trace(state, "lane.select", route=route, lane="clarify_lane")
    return "clarify_lane"


def _node_small_talk_lane(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    prompt = build_small_talk_prompt(request.message, state.get("history", []))
    _trace_prompt(state, "small_talk_lane.prompt", prompt)
    try:
        response = _get_llm().invoke([HumanMessage(content=prompt)])
        reply = _content_to_text(response.content)
    except Exception as exc:
        logger.warning("Small talk lane failed: %s", exc)
        _trace(state, "small_talk_lane.error", error=str(exc))
        reply = ""
    if not reply:
        reply = "Toi la CareNest AI. Toi co the ho tro cac cau hoi ve suc khoe gia dinh."
    _trace(state, "small_talk_lane.reply", reply=reply)
    return {"reply": reply, "status": "success"}


def _node_context_answer_lane(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    if not isinstance(request.context, dict):
        _trace(state, "context_answer_lane.missing_context")
        return {
            "route": "clarify",
            "reply": "Minh can them du lieu context de tra loi chinh xac. Ban co the noi ro doi tuong can xem khong?",
            "status": "success",
        }

    prompt = build_context_answer_prompt(
        message=request.message,
        history=state.get("history", []),
        context=request.context,
    )
    _trace_prompt(state, "context_answer_lane.prompt", prompt)
    result = _invoke_json_prompt(prompt, state=state, stage="context_answer_lane")

    action = str(result.get("action", "answer")).strip().lower()
    reply = result.get("reply")
    _trace(state, "context_answer_lane.decision", action=action, reply=reply)

    if action == "fallback_to_sql":
        _trace(state, "context_answer_lane.fallback_to_sql")
        return _node_text_to_sql_lane(state)

    if not isinstance(reply, str) or not reply.strip():
        reply = "Mình chưa đủ thông tin để trả lời. Bạn cho mình thêm thông tin chi tiết nhé."

    profiles = request.context.get("profiles")
    data = profiles if isinstance(profiles, list) else None
    return {"reply": reply, "status": "success", "data": data}


def _node_text_to_sql_lane(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    history = state.get("history", [])
    contextual_message = build_contextual_message(history, request.message)
    _trace(
        state,
        "text_to_sql_lane.start",
        user_message=request.message,
        contextual_message=contextual_message,
    )

    generation_prompt = build_sql_generation_prompt(
        user_id=request.user_id,
        message=request.message,
        contextual_message=contextual_message,
    )
    generation = _invoke_json_prompt(generation_prompt, state=state, stage="sql_generation")

    action = str(generation.get("action", "ask_clarification")).strip().lower()
    _trace(
        state,
        "sql_generation.decision",
        action=action,
        reason=generation.get("reason"),
        clarification_question=generation.get("clarification_question"),
        sql=generation.get("sql"),
    )
    if action == "reject":
        reason = str(generation.get("reason", "")).strip() or "Yeu cau nay khong thuoc pham vi ho tro."
        return {"route": "refuse", "reply": reason, "status": "success"}

    if action != "generate_sql":
        question = str(generation.get("clarification_question", "")).strip()
        if not question:
            question = "Ban muon xem thong tin cho ai va trong khoang thoi gian nao?"
        return {"route": "clarify", "reply": question, "status": "success"}

    raw_sql = generation.get("sql")
    if not isinstance(raw_sql, str) or not raw_sql.strip():
        return {
            "route": "clarify",
            "reply": "Minh can them thong tin de tao truy van chinh xac. Ban co the noi ro hon khong?",
            "status": "success",
        }

    sql = raw_sql.strip()

    # Programmatic safety checks (replaces separate sql_guard LLM call)
    tenant_ok = generation.get("tenant_scope_ok")
    read_only_ok = generation.get("read_only_ok")
    sensitive_ok = generation.get("sensitive_data_ok")
    if tenant_ok is False or read_only_ok is False or sensitive_ok is False:
        reason = generation.get("reason", "")
        reply = reason or "Minh khong the thuc hien yeu cau nay vi ly do an toan du lieu."
        _trace(
            state,
            "sql_safety_check.failed",
            tenant_scope_ok=tenant_ok,
            read_only_ok=read_only_ok,
            sensitive_data_ok=sensitive_ok,
            reason=reason,
        )
        return {"route": "refuse", "reply": reply, "status": "error", "sql": sql}

    sql = _ensure_limit(sql)
    query_start = time.time()
    try:
        rows = execute_query(sql)
    except Exception as exc:
        logger.error("SQL execution failed: %s", exc)
        _trace(state, "sql_execution.error", sql=sql, error=str(exc))
        return {
            "reply": "Khong tim thay du lieu phu hop hoac co loi khi truy van.",
            "status": "error",
            "sql": sql,
        }

    _trace(
        state,
        "sql_execution.success",
        sql=sql,
        row_count=len(rows) if isinstance(rows, list) else None,
        elapsed_ms=round((time.time() - query_start) * 1000, 2),
    )

    synthesis_prompt = build_answer_synthesis_prompt(
        message=request.message,
        previous_reply=_get_previous_reply(history),
        rows=rows,
    )
    _trace_prompt(state, "answer_synthesis.prompt", synthesis_prompt)
    try:
        synthesis_response = _get_llm().invoke([HumanMessage(content=synthesis_prompt)])
        reply = _content_to_text(synthesis_response.content)
    except Exception as exc:
        logger.warning("Answer synthesis failed: %s", exc)
        _trace(state, "answer_synthesis.error", error=str(exc))
        reply = ""
    if not reply:
        reply = f"Tim thay {len(rows)} ket qua." if rows else "Khong tim thay du lieu phu hop."

    _trace(
        state,
        "text_to_sql_lane.reply",
        reply=reply,
        row_count=len(rows) if isinstance(rows, list) else None,
    )

    return {
        "reply": reply,
        "status": "success",
        "sql": sql,
        "rows": rows,
        "data": rows if rows else None,
    }


def _node_clarify_lane(state: ChatGraphState) -> ChatGraphState:
    reply = state.get("reply")
    if isinstance(reply, str) and reply.strip():
        _trace(state, "clarify_lane.reply_existing", reply=reply)
        return {"reply": reply, "status": "success"}

    safety_reason = state.get("safety_reason", "")
    if safety_reason:
        _trace(state, "clarify_lane.reply_safety_reason", safety_reason=safety_reason)
        return {"reply": f"Minh can lam ro them truoc khi tra loi: {safety_reason}", "status": "success"}

    _trace(state, "clarify_lane.reply_default")
    return {
        "reply": "Ban co the noi ro hon ten nguoi, khoang thoi gian, hoac thong tin can xem de minh ho tro dung hon khong?",
        "status": "success",
    }


def _node_refuse_lane(state: ChatGraphState) -> ChatGraphState:
    reply = state.get("reply")
    if isinstance(reply, str) and reply.strip():
        _trace(state, "refuse_lane.reply_existing", reply=reply, status=state.get("status", "success"))
        return {"reply": reply, "status": state.get("status", "success")}

    reason = state.get("safety_reason", "")
    if reason:
        _trace(state, "refuse_lane.reply_safety_reason", safety_reason=reason)
        return {"reply": f"Minh khong the thuc hien yeu cau nay: {reason}", "status": "error"}

    _trace(state, "refuse_lane.reply_default")
    return {"reply": "Minh khong the thuc hien yeu cau nay vi chinh sach an toan du lieu.", "status": "error"}


def _node_response_guard(state: ChatGraphState) -> ChatGraphState:
    route = state.get("route", "clarify")
    if route in {"clarify", "refuse", "small_talk"}:
        _trace(state, "response_guard.skip", reason="route_is_terminal", route=route)
        return {}

    if route == "context_answer":
        _trace(state, "response_guard.skip", reason="already_context_guarded", route=route)
        return {}

    reply = state.get("reply")
    if not isinstance(reply, str) or not reply.strip():
        _trace(state, "response_guard.skip", reason="empty_reply")
        return {}

    request = state["request"]
    prompt = build_response_guard_prompt(
        route=route,
        message=request.message,
        draft_reply=reply,
        rows=state.get("rows"),
    )
    reviewed = _invoke_json_prompt(prompt, state=state, stage="response_guard")
    final_reply = reviewed.get("final_reply")
    if isinstance(final_reply, str) and final_reply.strip():
        _trace(state, "response_guard.rewrite", final_reply=final_reply)
        return {"reply": final_reply.strip()}
    _trace(state, "response_guard.keep_original")
    return {}


def _node_persist(state: ChatGraphState) -> ChatGraphState:
    conversation_id = state.get("conversation_id")
    if not conversation_id:
        _trace(state, "persist.skip", reason="missing_conversation_id")
        return {}

    reply = state.get("reply")
    if not isinstance(reply, str) or not reply.strip():
        reply = "Xin loi, minh chua the xu ly yeu cau luc nay. Ban vui long thu lai sau."
        state["status"] = "error"

    status = state.get("status", "success")
    start_time = state.get("start_time", time.time())
    execution_time = max(0.0, time.time() - start_time)

    msg_id = _save_assistant_response(
        conversation_id=conversation_id,
        sql=state.get("sql"),
        reply=reply,
        status=status,
        execution_time=execution_time,
    )
    conversation_service.touch_conversation(conversation_id)
    _trace(
        state,
        "persist.done",
        conversation_id=conversation_id,
        status=status,
        execution_time_ms=round(execution_time * 1000, 2),
        message_id=msg_id,
        has_sql=bool(state.get("sql")),
    )
    return {"message_id": msg_id}


def _build_chat_graph() -> Any:
    graph = StateGraph(ChatGraphState)
    graph.add_node("bootstrap", _node_bootstrap)
    graph.add_node("router_llm", _node_router_llm)
    graph.add_node("route_tools", ToolNode(ROUTE_TOOLS))
    graph.add_node("route_fallback", _node_route_fallback)
    graph.add_node("capture_route", _node_capture_route)
    graph.add_node("small_talk_lane", _node_small_talk_lane)
    graph.add_node("context_answer_lane", _node_context_answer_lane)
    graph.add_node("text_to_sql_lane", _node_text_to_sql_lane)
    graph.add_node("clarify_lane", _node_clarify_lane)
    graph.add_node("refuse_lane", _node_refuse_lane)
    graph.add_node("response_guard", _node_response_guard)
    graph.add_node("persist", _node_persist)

    graph.add_edge(START, "bootstrap")
    graph.add_edge("bootstrap", "router_llm")
    graph.add_conditional_edges(
        "router_llm",
        _has_route_tool_call,
        {
            "tool": "route_tools",
            "fallback": "route_fallback",
        },
    )
    graph.add_edge("route_tools", "capture_route")
    graph.add_edge("route_fallback", "capture_route")
    graph.add_conditional_edges(
        "capture_route",
        _select_lane,
        {
            "small_talk_lane": "small_talk_lane",
            "context_answer_lane": "context_answer_lane",
            "text_to_sql_lane": "text_to_sql_lane",
            "clarify_lane": "clarify_lane",
            "refuse_lane": "refuse_lane",
        },
    )
    graph.add_edge("small_talk_lane", "response_guard")
    graph.add_edge("context_answer_lane", "response_guard")
    graph.add_edge("text_to_sql_lane", "response_guard")
    graph.add_edge("clarify_lane", "response_guard")
    graph.add_edge("refuse_lane", "response_guard")
    graph.add_edge("response_guard", "persist")
    graph.add_edge("persist", END)
    return graph.compile()


def _get_chat_graph() -> Any:
    global _chat_graph
    if _chat_graph is None:
        _chat_graph = _build_chat_graph()
    return _chat_graph


def _build_error_response(request: ChatRequest, start_time: float, trace_id: str) -> ChatResponse:
    _trace(
        {"trace_id": trace_id},
        "process_chat.error_fallback.start",
        user_id=request.user_id,
        conversation_id=request.conversation_id,
        message=request.message,
    )

    conversation_id = request.conversation_id
    if conversation_id:
        conv = conversation_service.get_conversation(conversation_id, request.user_id)
        if not conv:
            conversation_id = None

    if not conversation_id:
        conversation_id = conversation_service.create_conversation(
            user_id=request.user_id,
            title=request.message[:100],
        )

    reply = "Xin loi, minh gap su co trong luc xu ly yeu cau. Ban vui long thu lai."
    msg_id = _save_assistant_response(
        conversation_id=conversation_id,
        sql=None,
        reply=reply,
        status="error",
        execution_time=max(0.0, time.time() - start_time),
    )
    conversation_service.touch_conversation(conversation_id)
    _trace(
        {"trace_id": trace_id},
        "process_chat.error_fallback.done",
        conversation_id=conversation_id,
        message_id=msg_id,
    )
    return ChatResponse(reply=reply, conversation_id=conversation_id, message_id=msg_id)


def process_chat(request: ChatRequest) -> ChatResponse:
    start_time = time.time()
    trace_id = f"chat-{uuid4().hex[:8]}"
    graph = _get_chat_graph()

    _trace(
        {"trace_id": trace_id},
        "process_chat.start",
        user_id=request.user_id,
        conversation_id=request.conversation_id,
        message=request.message,
        context_keys=sorted(request.context.keys()) if isinstance(request.context, dict) else None,
    )

    try:
        result = graph.invoke({"trace_id": trace_id, "request": request, "start_time": start_time})
    except Exception as exc:
        logger.exception("Chat graph failed: %s", exc)
        _trace({"trace_id": trace_id}, "process_chat.graph_error", error=str(exc))
        return _build_error_response(request, start_time, trace_id)

    conversation_id = result.get("conversation_id")
    if not conversation_id:
        _trace({"trace_id": trace_id}, "process_chat.invalid_result", result=result)
        return _build_error_response(request, start_time, trace_id)

    reply = result.get("reply")
    if not isinstance(reply, str) or not reply.strip():
        reply = "Xin loi, minh chua the tra loi yeu cau nay luc nay."

    _trace(
        {"trace_id": trace_id},
        "process_chat.done",
        conversation_id=conversation_id,
        route=result.get("route"),
        status=result.get("status"),
        sql_generated=result.get("sql"),
        message_id=result.get("message_id"),
        elapsed_ms=round((time.time() - start_time) * 1000, 2),
        reply=reply,
    )

    return ChatResponse(
        reply=reply,
        conversation_id=conversation_id,
        message_id=result.get("message_id"),
        sql_generated=result.get("sql"),
        data=result.get("data"),
    )
