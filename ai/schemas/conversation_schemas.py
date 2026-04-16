from typing import Optional

from pydantic import BaseModel


class ConversationListItem(BaseModel):
    conversation_id: int
    title: str
    status: str
    created_at: str
    updated_at: str
    message_count: int


class ConversationListResponse(BaseModel):
    conversations: list[ConversationListItem]
    total: int


class MessageItem(BaseModel):
    message_id: int
    sender: str
    message_type: str
    content: str
    sent_at: str


class ConversationMessagesResponse(BaseModel):
    conversation_id: int
    messages: list[MessageItem]


class ConversationCloseResponse(BaseModel):
    conversation_id: int
    status: str
