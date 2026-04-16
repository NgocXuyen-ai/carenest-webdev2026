import io
import logging

import speech_recognition as sr
from gtts import gTTS
from pydub import AudioSegment
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

_WAV_MAGIC = (b'RIFF', b'FORM', b'fLaC')

_CONTENT_TYPE_FORMAT = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "mp4",
    "audio/aac": "aac",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/x-m4a": "m4a",
}


def ensure_wav(audio_bytes: bytes, content_type: str = "") -> bytes:
    """
    Return WAV bytes. If input is already WAV/AIFF/FLAC, return as-is.
    Otherwise transcode using pydub (requires ffmpeg installed).
    """
    header = audio_bytes[:4]
    if any(header.startswith(magic) for magic in _WAV_MAGIC):
        return audio_bytes

    fmt = _CONTENT_TYPE_FORMAT.get(content_type.lower().split(";")[0].strip())
    try:
        # If fmt is None (unknown MIME type), omit format and let ffmpeg autodetect
        if fmt:
            segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format=fmt)
        else:
            segment = AudioSegment.from_file(io.BytesIO(audio_bytes))
        out = io.BytesIO()
        segment.export(out, format="wav")
        out.seek(0)
        return out.read()
    except Exception as e:
        raise RuntimeError(
            f"Không thể chuyển đổi định dạng audio '{content_type}' sang WAV. "
            f"Vui lòng gửi file WAV, AIFF hoặc FLAC. Chi tiết: {e}"
        )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type((sr.RequestError, RuntimeError, ConnectionError, OSError)),
    reraise=True,
)
def speech_to_text(audio_bytes: bytes, language: str = "vi-VN") -> str:
    """Convert WAV audio bytes to text using Google Speech Recognition."""
    recognizer = sr.Recognizer()
    audio_file = io.BytesIO(audio_bytes)
    with sr.AudioFile(audio_file) as source:
        audio = recognizer.record(source)
    try:
        return recognizer.recognize_google(audio, language=language)
    except sr.UnknownValueError:
        return ""
    except sr.RequestError as e:
        raise RuntimeError(f"Lỗi kết nối Google Speech API: {e}")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type((RuntimeError, ConnectionError, OSError)),
    reraise=True,
)
def text_to_speech(text: str, lang: str = "vi") -> bytes:
    """Convert text to MP3 audio bytes using gTTS."""
    tts = gTTS(text=text, lang=lang)
    output = io.BytesIO()
    tts.write_to_fp(output)
    output.seek(0)
    return output.read()
