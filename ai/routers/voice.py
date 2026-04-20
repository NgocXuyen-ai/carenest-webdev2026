import asyncio
import base64
import io
import json
import logging
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
from utils.trace import emit_trace, new_trace_id, preview_text
from utils.internal_auth import verify_internal_request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/voice", tags=["voice"], dependencies=[Depends(verify_internal_request)])


@router.post("/stt", response_model=SttResponse)
@limiter.limit(settings.RATE_LIMIT_VOICE)
async def speech_to_text_endpoint(request: Request, audio: UploadFile = File(...)) -> SttResponse:
    trace_id = new_trace_id("api-voice-stt")
    emit_trace(
        logger,
        "api.voice.stt.start",
        trace_id=trace_id,
        filename=audio.filename,
        content_type=audio.content_type,
    )
    try:
        audio_bytes = await audio.read()
        wav_bytes = await asyncio.to_thread(ensure_wav, audio_bytes, audio.content_type or "", trace_id)
        text = voice_service.speech_to_text(wav_bytes, trace_id=trace_id)
        emit_trace(
            logger,
            "api.voice.stt.done",
            trace_id=trace_id,
            text_preview=preview_text(text),
            text_length=len(text),
        )
        return SttResponse(text=text)
    except Exception as e:
        emit_trace(logger, "api.voice.stt.error", trace_id=trace_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tts")
@limiter.limit(settings.RATE_LIMIT_VOICE)
def text_to_speech_endpoint(body: TtsRequest, request: Request) -> StreamingResponse:
    trace_id = new_trace_id("api-voice-tts")
    emit_trace(
        logger,
        "api.voice.tts.start",
        trace_id=trace_id,
        lang=body.lang,
        text_preview=preview_text(body.text),
        text_length=len(body.text),
    )
    try:
        audio_bytes = voice_service.text_to_speech(body.text, body.lang, trace_id=trace_id)
        emit_trace(
            logger,
            "api.voice.tts.done",
            trace_id=trace_id,
            output_bytes_size=len(audio_bytes),
        )
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"},
        )
    except Exception as e:
        emit_trace(logger, "api.voice.tts.error", trace_id=trace_id, error=str(e))
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
    trace_id = new_trace_id("api-voice-chat")
    emit_trace(
        logger,
        "api.voice.chat.start",
        trace_id=trace_id,
        user_id=user_id,
        conversation_id=conversation_id,
        filename=audio.filename,
        content_type=audio.content_type,
        has_context_json=bool(context_json),
    )
    try:
        audio_bytes = await audio.read()
        wav_bytes = await asyncio.to_thread(ensure_wav, audio_bytes, audio.content_type or "", trace_id)
        transcribed = await asyncio.to_thread(voice_service.speech_to_text, wav_bytes, "vi-VN", trace_id)
        emit_trace(
            logger,
            "api.voice.chat.transcribed",
            trace_id=trace_id,
            transcribed_preview=preview_text(transcribed),
            transcribed_length=len(transcribed),
        )

        if not transcribed:
            raise HTTPException(
                status_code=400,
                detail="Không nhận được giọng nói rõ ràng, vui lòng thử lại.",
            )

        context_payload = json.loads(context_json) if context_json else None
        emit_trace(
            logger,
            "api.voice.chat.context",
            trace_id=trace_id,
            context_keys=sorted(context_payload.keys()) if isinstance(context_payload, dict) else None,
        )
        chat_response = await asyncio.to_thread(
            process_chat,
            ChatRequest(
                user_id=user_id,
                message=transcribed,
                conversation_id=conversation_id,
                context=context_payload,
            ),
        )
        emit_trace(
            logger,
            "api.voice.chat.reply",
            trace_id=trace_id,
            reply_preview=preview_text(chat_response.reply),
            reply_length=len(chat_response.reply),
            resolved_conversation_id=chat_response.conversation_id,
        )
        audio_reply = await asyncio.to_thread(voice_service.text_to_speech, chat_response.reply, "vi", trace_id)
        audio_b64 = base64.b64encode(audio_reply).decode("utf-8")

        emit_trace(
            logger,
            "api.voice.chat.done",
            trace_id=trace_id,
            audio_bytes_size=len(audio_reply),
            audio_base64_size=len(audio_b64),
            conversation_id=chat_response.conversation_id,
        )

        return VoiceChatResponse(
            transcribed_text=transcribed,
            reply_text=chat_response.reply,
            audio_base64=audio_b64,
            conversation_id=chat_response.conversation_id,
        )
    except HTTPException:
        emit_trace(logger, "api.voice.chat.http_error", trace_id=trace_id)
        raise
    except Exception as e:
        emit_trace(logger, "api.voice.chat.error", trace_id=trace_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
