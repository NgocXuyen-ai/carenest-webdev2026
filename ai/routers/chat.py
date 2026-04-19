from fastapi import APIRouter, Depends, HTTPException, Request

from config import settings
from rate_limiter import limiter
from schemas.chat_schemas import ChatRequest, ChatResponse
from services.chat_service import process_chat
from utils.internal_auth import verify_internal_request

router = APIRouter(prefix="/internal", tags=["chat"], dependencies=[Depends(verify_internal_request)])


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.RATE_LIMIT_CHAT)
def chat(body: ChatRequest, request: Request) -> ChatResponse:
    try:
        return process_chat(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
