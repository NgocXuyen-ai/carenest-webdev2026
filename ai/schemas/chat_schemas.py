from typing import Any, Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    user_id: int
    message: str
    conversation_id: Optional[int] = None
    context: Optional[dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str
    conversation_id: int
    message_id: Optional[int] = None
    sql_generated: Optional[str] = None
    data: Optional[list] = None
