import json
import logging
import time
from datetime import datetime, timedelta
from typing import Annotated, Any, Optional, TypedDict

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
    build_context_answer_guard_prompt,
    build_pre_route_guard_prompt,
    build_response_guard_prompt,
    build_router_prompt,
    build_small_talk_prompt,
    build_sql_generation_prompt,
    build_sql_guard_prompt,
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
    payload = {
        "route": "small_talk",
        "reason": reason or "General conversational intent.",
        "confidence": confidence,
    }
    return json.dumps(payload, ensure_ascii=False)


@tool("route_context_answer")
def route_context_answer(reason: str = "", confidence: float = 0.65) -> str:
    """Route to context-based answer lane (no SQL generation)."""
    payload = {
        "route": "context_answer",
        "reason": reason or "Can be answered from existing context.",
        "confidence": confidence,
    }
    return json.dumps(payload, ensure_ascii=False)


@tool("route_text_to_sql")
def route_text_to_sql(reason: str = "", confidence: float = 0.65) -> str:
    """Route to text-to-SQL lane."""
    payload = {
        "route": "text_to_sql",
        "reason": reason or "Needs data query from database.",
        "confidence": confidence,
    }
    return json.dumps(payload, ensure_ascii=False)


@tool("route_clarify")
def route_clarify(reason: str = "", confidence: float = 0.65) -> str:
    """Route to clarification lane."""
    payload = {
        "route": "clarify",
        "reason": reason or "Need additional detail before answering safely.",
        "confidence": confidence,
    }
    return json.dumps(payload, ensure_ascii=False)


@tool("route_refuse")
def route_refuse(reason: str = "", confidence: float = 0.65) -> str:
    """Route to refusal lane."""
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


def _invoke_json_prompt(prompt: str) -> dict[str, Any]:
    try:
        llm = _get_llm()
        response = llm.invoke([HumanMessage(content=prompt)])
    except Exception as exc:
        logger.warning("JSON prompt invoke failed: %s", exc)
        return {}

    parsed = _extract_first_json_object(_content_to_text(response.content))
    return parsed or {}


def _node_bootstrap(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    conversation_id = request.conversation_id

    if conversation_id:
        conv = conversation_service.get_conversation(conversation_id, request.user_id)
        if not conv:
            conversation_id = None
        elif str(conv.get("status")).upper() == "CLOSED":
            conversation_id = None
        elif _is_expired(conv.get("updated_at")):
            conversation_service.close_conversation(conversation_id)
            conversation_id = None

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

    return {
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
    try:
        router = _get_router_llm()
        ai_message = router.invoke([HumanMessage(content=prompt)])
        if not getattr(ai_message, "tool_calls", None):
            retry_prompt = (
                "Bạn chưa gọi route tool ở lần trả lời trước. "
                "Hãy gọi chính xác một route tool ngay bây giờ.\n\n"
                + prompt
            )
            ai_message = router.invoke([HumanMessage(content=retry_prompt)])
    except Exception as exc:
        logger.warning("Router LLM failed, switching to fallback route: %s", exc)
        return {"messages": []}
    return {"messages": [ai_message]}


def _has_route_tool_call(state: ChatGraphState) -> str:
    messages = state.get("messages", [])
    if messages:
        last = messages[-1]
        if isinstance(last, AIMessage) and getattr(last, "tool_calls", None):
            names = {tc.get("name") for tc in last.tool_calls if isinstance(tc, dict)}
            expected_names = {t.name for t in ROUTE_TOOLS}
            if names.intersection(expected_names):
                return "tool"
            return "fallback"
    return "fallback"


def _node_route_fallback(state: ChatGraphState) -> ChatGraphState:
    messages = state.get("messages", [])
    if not messages:
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
    return {"route": route, "route_reason": reason, "route_confidence": confidence}


def _node_capture_route(state: ChatGraphState) -> ChatGraphState:
    messages = state.get("messages", [])
    for message in reversed(messages):
        if isinstance(message, ToolMessage):
            parsed = _extract_first_json_object(_content_to_text(message.content)) or {}
            route = _normalize_route(str(parsed.get("route", "clarify")))
            reason = str(parsed.get("reason", "Route selected by tool call.")).strip()
            confidence = _normalize_confidence(parsed.get("confidence", 0.6), default=0.6)
            return {"route": route, "route_reason": reason, "route_confidence": confidence}

    return {}


def _node_pre_route_guard(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    prompt = build_pre_route_guard_prompt(
        route=state.get("route", "clarify"),
        route_reason=state.get("route_reason", ""),
        message=request.message,
        context=request.context,
    )
    guard = _invoke_json_prompt(prompt)
    if not guard or "allow" not in guard:
        return {
            "route": "clarify",
            "safety_decision": "deny",
            "safety_reason": "Safety guard output was unavailable, so the request was routed to a safe clarification path.",
        }

    allow_raw = guard.get("allow")
    allow = allow_raw is True or (isinstance(allow_raw, str) and allow_raw.strip().lower() == "true")
    normalized_route = _normalize_route(str(guard.get("normalized_route", state.get("route", "clarify"))))
    reason = str(guard.get("reason", "")).strip()

    if not allow and normalized_route not in {"clarify", "refuse"}:
        normalized_route = "clarify"

    return {
        "route": normalized_route,
        "safety_decision": "allow" if allow else "deny",
        "safety_reason": reason,
    }


def _select_lane(state: ChatGraphState) -> str:
    route = state.get("route", "clarify")
    if route == "small_talk":
        return "small_talk_lane"
    if route == "context_answer":
        return "context_answer_lane"
    if route == "text_to_sql":
        return "text_to_sql_lane"
    if route == "refuse":
        return "refuse_lane"
    return "clarify_lane"


def _node_small_talk_lane(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    prompt = build_small_talk_prompt(request.message, state.get("history", []))
    try:
        response = _get_llm().invoke([HumanMessage(content=prompt)])
        reply = _content_to_text(response.content)
    except Exception as exc:
        logger.warning("Small talk lane failed: %s", exc)
        reply = ""
    if not reply:
        reply = "Toi la CareNest AI. Toi co the ho tro cac cau hoi ve suc khoe gia dinh."
    return {"reply": reply, "status": "success"}


def _node_context_answer_lane(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    if not isinstance(request.context, dict):
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
    try:
        response = _get_llm().invoke([HumanMessage(content=prompt)])
        reply = _content_to_text(response.content)
    except Exception as exc:
        logger.warning("Context lane failed: %s", exc)
        reply = ""
    if not reply:
        reply = "Mình chưa đủ thông tin để trả lời. Bạn cho mình thêm thông tin chi tiết nhé."

    guard_prompt = build_context_answer_guard_prompt(
        message=request.message,
        draft_reply=reply,
        context=request.context,
    )
    guarded = _invoke_json_prompt(guard_prompt)
    action = str(guarded.get("action", "keep_answer")).strip().lower()
    guarded_reply = guarded.get("final_reply")
    if isinstance(guarded_reply, str) and guarded_reply.strip():
        reply = guarded_reply.strip()

    if action == "fallback_to_sql":
        logger.info("context_answer_guard requested fallback_to_sql for message=%s", request.message)
        return _node_text_to_sql_lane(state)

    profiles = request.context.get("profiles")
    data = profiles if isinstance(profiles, list) else None
    return {"reply": reply, "status": "success", "data": data}


def _node_text_to_sql_lane(state: ChatGraphState) -> ChatGraphState:
    request = state["request"]
    history = state.get("history", [])
    contextual_message = build_contextual_message(history, request.message)

    generation_prompt = build_sql_generation_prompt(
        user_id=request.user_id,
        message=request.message,
        contextual_message=contextual_message,
    )
    generation = _invoke_json_prompt(generation_prompt)

    action = str(generation.get("action", "ask_clarification")).strip().lower()
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
    guard_prompt = build_sql_guard_prompt(request.user_id, request.message, sql)
    guard = _invoke_json_prompt(guard_prompt)
    verdict = str(guard.get("verdict", "reject")).strip().lower()
    reason = str(guard.get("reason", "")).strip()

    revised_sql = guard.get("revised_sql")
    if isinstance(revised_sql, str) and revised_sql.strip():
        sql = revised_sql.strip()

    if verdict == "clarify":
        question = str(guard.get("clarification_question", "")).strip()
        reply = question or reason or "Ban co the noi ro hon de minh truy van an toan va dung y khong?"
        return {"route": "clarify", "reply": reply, "status": "success", "sql": sql}

    if verdict != "allow":
        reply = reason or "Minh khong the thuc hien yeu cau nay vi ly do an toan du lieu."
        return {"route": "refuse", "reply": reply, "status": "error", "sql": sql}

    sql = _ensure_limit(sql)
    try:
        rows = execute_query(sql)
    except Exception as exc:
        logger.error("SQL execution failed: %s", exc)
        return {
            "reply": "Khong tim thay du lieu phu hop hoac co loi khi truy van.",
            "status": "error",
            "sql": sql,
        }

    synthesis_prompt = build_answer_synthesis_prompt(
        message=request.message,
        previous_reply=_get_previous_reply(history),
        rows=rows,
    )
    try:
        synthesis_response = _get_llm().invoke([HumanMessage(content=synthesis_prompt)])
        reply = _content_to_text(synthesis_response.content)
    except Exception as exc:
        logger.warning("Answer synthesis failed: %s", exc)
        reply = ""
    if not reply:
        reply = f"Tim thay {len(rows)} ket qua." if rows else "Khong tim thay du lieu phu hop."

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
        return {"reply": reply, "status": "success"}

    safety_reason = state.get("safety_reason", "")
    if safety_reason:
        return {"reply": f"Minh can lam ro them truoc khi tra loi: {safety_reason}", "status": "success"}

    return {
        "reply": "Ban co the noi ro hon ten nguoi, khoang thoi gian, hoac thong tin can xem de minh ho tro dung hon khong?",
        "status": "success",
    }


def _node_refuse_lane(state: ChatGraphState) -> ChatGraphState:
    reply = state.get("reply")
    if isinstance(reply, str) and reply.strip():
        return {"reply": reply, "status": state.get("status", "success")}

    reason = state.get("safety_reason", "")
    if reason:
        return {"reply": f"Minh khong the thuc hien yeu cau nay: {reason}", "status": "error"}

    return {"reply": "Minh khong the thuc hien yeu cau nay vi chinh sach an toan du lieu.", "status": "error"}


def _node_response_guard(state: ChatGraphState) -> ChatGraphState:
    route = state.get("route", "clarify")
    if route in {"clarify", "refuse"}:
        return {}

    reply = state.get("reply")
    if not isinstance(reply, str) or not reply.strip():
        return {}

    request = state["request"]
    prompt = build_response_guard_prompt(
        route=route,
        message=request.message,
        draft_reply=reply,
        rows=state.get("rows"),
    )
    reviewed = _invoke_json_prompt(prompt)
    final_reply = reviewed.get("final_reply")
    if isinstance(final_reply, str) and final_reply.strip():
        return {"reply": final_reply.strip()}
    return {}


def _node_persist(state: ChatGraphState) -> ChatGraphState:
    conversation_id = state.get("conversation_id")
    if not conversation_id:
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
    return {"message_id": msg_id}


def _build_chat_graph() -> Any:
    graph = StateGraph(ChatGraphState)
    graph.add_node("bootstrap", _node_bootstrap)
    graph.add_node("router_llm", _node_router_llm)
    graph.add_node("route_tools", ToolNode(ROUTE_TOOLS))
    graph.add_node("route_fallback", _node_route_fallback)
    graph.add_node("capture_route", _node_capture_route)
    graph.add_node("pre_route_guard", _node_pre_route_guard)
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
    graph.add_edge("capture_route", "pre_route_guard")
    graph.add_conditional_edges(
        "pre_route_guard",
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


def _build_error_response(request: ChatRequest, start_time: float) -> ChatResponse:
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
    return ChatResponse(reply=reply, conversation_id=conversation_id, message_id=msg_id)


def process_chat(request: ChatRequest) -> ChatResponse:
    start_time = time.time()
    graph = _get_chat_graph()

    try:
        result = graph.invoke({"request": request, "start_time": start_time})
    except Exception as exc:
        logger.exception("Chat graph failed: %s", exc)
        return _build_error_response(request, start_time)

    conversation_id = result.get("conversation_id")
    if not conversation_id:
        return _build_error_response(request, start_time)

    reply = result.get("reply")
    if not isinstance(reply, str) or not reply.strip():
        reply = "Xin loi, minh chua the tra loi yeu cau nay luc nay."

    return ChatResponse(
        reply=reply,
        conversation_id=conversation_id,
        message_id=result.get("message_id"),
        sql_generated=result.get("sql"),
        data=result.get("data"),
    )
