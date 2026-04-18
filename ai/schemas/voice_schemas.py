from typing import Optional

from pydantic import BaseModel


class SttResponse(BaseModel):
    text: str


class TtsRequest(BaseModel):
    text: str
    lang: str = "vi"


class VoiceChatResponse(BaseModel):
    transcribed_text: str
    reply_text: str
    audio_base64: str
    conversation_id: Optional[int] = None
