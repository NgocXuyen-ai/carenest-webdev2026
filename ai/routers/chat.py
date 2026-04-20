import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from config import settings
from rate_limiter import limiter
from schemas.chat_schemas import ChatRequest, ChatResponse
from services.chat_service import process_chat
from utils.trace import emit_trace, new_trace_id
from utils.internal_auth import verify_internal_request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal", tags=["chat"], dependencies=[Depends(verify_internal_request)])


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.RATE_LIMIT_CHAT)
def chat(body: ChatRequest, request: Request) -> ChatResponse:
    trace_id = new_trace_id("api-chat")
    emit_trace(
        logger,
        "api.chat.start",
        trace_id=trace_id,
        user_id=body.user_id,
        conversation_id=body.conversation_id,
        message=body.message,
        context_keys=sorted(body.context.keys()) if isinstance(body.context, dict) else None,
    )
    try:
        response = process_chat(body)
        emit_trace(
            logger,
            "api.chat.done",
            trace_id=trace_id,
            conversation_id=response.conversation_id,
            message_id=response.message_id,
            has_sql=bool(response.sql_generated),
            has_data=bool(response.data),
        )
        return response
    except Exception as e:
        emit_trace(logger, "api.chat.error", trace_id=trace_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
