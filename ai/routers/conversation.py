from fastapi import APIRouter, Depends, HTTPException, Query, Request

from config import settings
from rate_limiter import limiter
from schemas.conversation_schemas import (
    ConversationCloseResponse,
    ConversationListItem,
    ConversationListResponse,
    ConversationMessagesResponse,
    MessageItem,
)
from services import conversation_service
from utils.internal_auth import verify_internal_request

router = APIRouter(
    prefix="/internal/conversations",
    tags=["conversations"],
    dependencies=[Depends(verify_internal_request)],
)


@router.get("", response_model=ConversationListResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
def list_conversations(
    request: Request,
    user_id: int = Query(...),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
) -> ConversationListResponse:
    """List conversations for a user, ordered by most recent activity."""
    conversations, total = conversation_service.list_conversations(user_id, limit, offset)
    items = [
        ConversationListItem(
            conversation_id=c["conversation_id"],
            title=c["title"] or "",
            status=c["status"] or "active",
            created_at=str(c["created_at"] or ""),
            updated_at=str(c["updated_at"] or ""),
            message_count=int(c.get("message_count") or 0),
        )
        for c in conversations
    ]
    return ConversationListResponse(conversations=items, total=total)


@router.get("/{conversation_id}/messages", response_model=ConversationMessagesResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
def get_messages(
    conversation_id: int,
    request: Request,
    user_id: int = Query(...),
) -> ConversationMessagesResponse:
    """Get all messages in a conversation (ownership verified)."""
    messages = conversation_service.get_conversation_messages(conversation_id, user_id)
    if not messages:
        conv = conversation_service.get_conversation(conversation_id, user_id)
        if conv is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
    items = [
        MessageItem(
            message_id=m["message_id"],
            sender=m["sender"],
            message_type=m["message_type"],
            content=m["content"],
            sent_at=str(m["sent_at"] or ""),
        )
        for m in messages
    ]
    return ConversationMessagesResponse(conversation_id=conversation_id, messages=items)


@router.post("/{conversation_id}/close", response_model=ConversationCloseResponse)
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
def close_conversation(
    conversation_id: int,
    request: Request,
    user_id: int = Query(...),
) -> ConversationCloseResponse:
    """Explicitly close a conversation."""
    conv = conversation_service.get_conversation(conversation_id, user_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conversation_service.close_conversation(conversation_id)
    return ConversationCloseResponse(conversation_id=conversation_id, status="closed")
