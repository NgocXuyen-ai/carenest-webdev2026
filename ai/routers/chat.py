from fastapi import APIRouter, HTTPException, Request

from config import settings
from rate_limiter import limiter
from schemas.chat_schemas import ChatRequest, ChatResponse
from services.chat_service import process_chat

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.RATE_LIMIT_CHAT)
def chat(body: ChatRequest, request: Request) -> ChatResponse:
    try:
        return process_chat(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
