import asyncio
import base64
import io
import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse

from config import settings
from rate_limiter import limiter
from schemas.chat_schemas import ChatRequest
from schemas.voice_schemas import SttResponse, TtsRequest, VoiceChatResponse
from services import voice_service
from services.voice_service import ensure_wav
from services.chat_service import process_chat
from utils.internal_auth import verify_internal_request

router = APIRouter(prefix="/internal/voice", tags=["voice"], dependencies=[Depends(verify_internal_request)])


@router.post("/stt", response_model=SttResponse)
@limiter.limit(settings.RATE_LIMIT_VOICE)
async def speech_to_text_endpoint(request: Request, audio: UploadFile = File(...)) -> SttResponse:
    try:
        audio_bytes = await audio.read()
        wav_bytes = await asyncio.to_thread(ensure_wav, audio_bytes, audio.content_type or "")
        text = voice_service.speech_to_text(wav_bytes)
        return SttResponse(text=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tts")
@limiter.limit(settings.RATE_LIMIT_VOICE)
def text_to_speech_endpoint(body: TtsRequest, request: Request) -> StreamingResponse:
    try:
        audio_bytes = voice_service.text_to_speech(body.text, body.lang)
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=VoiceChatResponse)
@limiter.limit(settings.RATE_LIMIT_VOICE)
async def voice_chat(
    request: Request,
    user_id: int = Form(...),
    audio: UploadFile = File(...),
    conversation_id: Optional[int] = Form(None),
    context_json: Optional[str] = Form(None),
) -> VoiceChatResponse:
    try:
        audio_bytes = await audio.read()
        wav_bytes = await asyncio.to_thread(ensure_wav, audio_bytes, audio.content_type or "")
        transcribed = await asyncio.to_thread(voice_service.speech_to_text, wav_bytes)

        if not transcribed:
            raise HTTPException(
                status_code=400,
                detail="Không nhận được giọng nói rõ ràng, vui lòng thử lại.",
            )

        context_payload = json.loads(context_json) if context_json else None
        chat_response = await asyncio.to_thread(
            process_chat,
            ChatRequest(
                user_id=user_id,
                message=transcribed,
                conversation_id=conversation_id,
                context=context_payload,
            ),
        )
        audio_reply = await asyncio.to_thread(voice_service.text_to_speech, chat_response.reply)
        audio_b64 = base64.b64encode(audio_reply).decode("utf-8")

        return VoiceChatResponse(
            transcribed_text=transcribed,
            reply_text=chat_response.reply,
            audio_base64=audio_b64,
            conversation_id=chat_response.conversation_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
