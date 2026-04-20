import io
import logging
import time
from typing import Optional

from openai import APIConnectionError, APIError, APITimeoutError, AzureOpenAI
from pydub import AudioSegment
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from config import settings
from utils.trace import emit_trace, preview_text

logger = logging.getLogger(__name__)

_WAV_MAGIC = (b'RIFF', b'FORM', b'fLaC')
_azure_stt_client: Optional[AzureOpenAI] = None
_azure_tts_client: Optional[AzureOpenAI] = None

_CONTENT_TYPE_FORMAT = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "mp4",
    "audio/aac": "aac",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/x-m4a": "m4a",
}


def _ensure_azure_voice_settings(kind: str) -> None:
    if (settings.VOICE_PROVIDER or "").strip().lower() != "azure":
        raise RuntimeError("VOICE_PROVIDER phải là 'azure' để dùng tính năng voice.")

    if kind == "stt":
        required = {
            "AZURE_STT_ENDPOINT": settings.AZURE_STT_ENDPOINT,
            "AZURE_STT_API_KEY": settings.AZURE_STT_API_KEY,
            "AZURE_STT_DEPLOYMENT": settings.AZURE_STT_DEPLOYMENT,
            "AZURE_STT_API_VERSION": settings.AZURE_STT_API_VERSION,
        }
    else:
        required = {
            "AZURE_TTS_ENDPOINT": settings.AZURE_TTS_ENDPOINT,
            "AZURE_TTS_API_KEY": settings.AZURE_TTS_API_KEY,
            "AZURE_TTS_DEPLOYMENT": settings.AZURE_TTS_DEPLOYMENT,
            "AZURE_TTS_API_VERSION": settings.AZURE_TTS_API_VERSION,
        }

    missing = [key for key, value in required.items() if not str(value or "").strip()]
    if missing:
        raise RuntimeError(f"Thiếu cấu hình Azure voice: {', '.join(missing)}")


def _normalize_endpoint(value: str) -> str:
    return value.rstrip("/")


def _get_azure_stt_client() -> AzureOpenAI:
    global _azure_stt_client
    _ensure_azure_voice_settings("stt")
    if _azure_stt_client is None:
        _azure_stt_client = AzureOpenAI(
            api_key=settings.AZURE_STT_API_KEY,
            api_version=settings.AZURE_STT_API_VERSION,
            azure_endpoint=_normalize_endpoint(settings.AZURE_STT_ENDPOINT),
            timeout=settings.LLM_TIMEOUT,
            max_retries=settings.LLM_MAX_RETRIES,
        )
    return _azure_stt_client


def _get_azure_tts_client() -> AzureOpenAI:
    global _azure_tts_client
    _ensure_azure_voice_settings("tts")
    if _azure_tts_client is None:
        _azure_tts_client = AzureOpenAI(
            api_key=settings.AZURE_TTS_API_KEY,
            api_version=settings.AZURE_TTS_API_VERSION,
            azure_endpoint=_normalize_endpoint(settings.AZURE_TTS_ENDPOINT),
            timeout=settings.LLM_TIMEOUT,
            max_retries=settings.LLM_MAX_RETRIES,
        )
    return _azure_tts_client


def ensure_wav(audio_bytes: bytes, content_type: str = "", trace_id: Optional[str] = None) -> bytes:
    """
    Return WAV bytes. If input is already WAV/AIFF/FLAC, return as-is.
    Otherwise transcode using pydub (requires ffmpeg installed).
    """
    header = audio_bytes[:4]
    emit_trace(
        logger,
        "voice.ensure_wav.start",
        trace_id=trace_id,
        content_type=content_type,
        input_bytes_size=len(audio_bytes),
    )
    if any(header.startswith(magic) for magic in _WAV_MAGIC):
        emit_trace(
            logger,
            "voice.ensure_wav.skip_convert",
            trace_id=trace_id,
            reason="already_wav_or_supported_lossless",
            output_bytes_size=len(audio_bytes),
        )
        return audio_bytes

    fmt = _CONTENT_TYPE_FORMAT.get(content_type.lower().split(";")[0].strip())
    try:
        transcode_start = time.time()
        # If fmt is None (unknown MIME type), omit format and let ffmpeg autodetect
        if fmt:
            segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format=fmt)
        else:
            segment = AudioSegment.from_file(io.BytesIO(audio_bytes))
        out = io.BytesIO()
        segment.export(out, format="wav")
        out.seek(0)
        output_bytes = out.read()
        emit_trace(
            logger,
            "voice.ensure_wav.success",
            trace_id=trace_id,
            source_format=fmt or "autodetect",
            output_bytes_size=len(output_bytes),
            elapsed_ms=round((time.time() - transcode_start) * 1000, 2),
        )
        return output_bytes
    except Exception as e:
        emit_trace(
            logger,
            "voice.ensure_wav.error",
            trace_id=trace_id,
            content_type=content_type,
            error=str(e),
        )
        raise RuntimeError(
            f"Không thể chuyển đổi định dạng audio '{content_type}' sang WAV. "
            f"Vui lòng gửi file WAV, AIFF hoặc FLAC. Chi tiết: {e}"
        )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type((APIConnectionError, APITimeoutError, APIError, RuntimeError, ConnectionError, OSError)),
    reraise=True,
)
def speech_to_text(audio_bytes: bytes, language: str = "vi-VN", trace_id: Optional[str] = None) -> str:
    """Convert WAV audio bytes to text using Azure OpenAI transcription."""
    emit_trace(
        logger,
        "voice.stt.start",
        trace_id=trace_id,
        language=language,
        audio_bytes_size=len(audio_bytes),
    )

    client = _get_azure_stt_client()
    start = time.time()
    try:
        transcript = client.audio.transcriptions.create(
            model=settings.AZURE_STT_DEPLOYMENT,
            file=("voice.wav", audio_bytes, "audio/wav"),
            language=language,
        )
        text = (getattr(transcript, "text", None) or "").strip()
        emit_trace(
            logger,
            "voice.stt.success",
            trace_id=trace_id,
            text_preview=preview_text(text),
            text_length=len(text),
            provider="azure",
            deployment=settings.AZURE_STT_DEPLOYMENT,
            elapsed_ms=round((time.time() - start) * 1000, 2),
        )
        return text
    except Exception as e:
        if "empty" in str(e).lower() or "silence" in str(e).lower():
            emit_trace(
                logger,
                "voice.stt.empty",
                trace_id=trace_id,
                reason="no_transcription_text",
            )
            return ""

        emit_trace(
            logger,
            "voice.stt.error",
            trace_id=trace_id,
            error=str(e),
            provider="azure",
            deployment=settings.AZURE_STT_DEPLOYMENT,
        )
        raise RuntimeError(f"Lỗi Azure STT: {e}")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type((APIConnectionError, APITimeoutError, APIError, RuntimeError, ConnectionError, OSError)),
    reraise=True,
)
def text_to_speech(text: str, lang: str = "vi", trace_id: Optional[str] = None) -> bytes:
    """Convert text to MP3 audio bytes using Azure OpenAI speech."""
    emit_trace(
        logger,
        "voice.tts.start",
        trace_id=trace_id,
        lang=lang,
        text_preview=preview_text(text),
        text_length=len(text),
    )

    client = _get_azure_tts_client()
    start = time.time()
    try:
        audio_response = client.audio.speech.create(
            model=settings.AZURE_TTS_DEPLOYMENT,
            voice=settings.AZURE_TTS_VOICE,
            input=text,
            response_format="mp3",
        )

        if hasattr(audio_response, "read"):
            audio_bytes = audio_response.read()
        elif isinstance(audio_response, (bytes, bytearray)):
            audio_bytes = bytes(audio_response)
        elif hasattr(audio_response, "content"):
            audio_bytes = bytes(audio_response.content)
        else:
            raise RuntimeError("Azure TTS trả về dữ liệu audio không hợp lệ")
    except Exception as e:
        emit_trace(
            logger,
            "voice.tts.error",
            trace_id=trace_id,
            lang=lang,
            error=str(e),
            provider="azure",
            deployment=settings.AZURE_TTS_DEPLOYMENT,
        )
        raise RuntimeError(f"Lỗi Azure TTS: {e}")

    emit_trace(
        logger,
        "voice.tts.success",
        trace_id=trace_id,
        lang=lang,
        output_bytes_size=len(audio_bytes),
        provider="azure",
        deployment=settings.AZURE_TTS_DEPLOYMENT,
        voice=settings.AZURE_TTS_VOICE,
        elapsed_ms=round((time.time() - start) * 1000, 2),
    )
    return audio_bytes
