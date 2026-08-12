import uuid

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class MessageCreate(BaseModel):
    content:str
    socket_id : str | None = None

class MessageResponse(BaseModel):
    id:uuid.UUID
    conversation_id:uuid.UUID
    sender_id:uuid.UUID
    content:str
    is_edited:bool 
    edited_at: datetime | None
    is_deleted: bool
    deleted_at: datetime | None
    created_at:datetime

    model_config = ConfigDict(from_attributes=True)

class MessageListItem(BaseModel):
    id:uuid.UUID
    conversation_id:uuid.UUID
    sender_id:uuid.UUID
    content:str
    is_edited:bool
    edited_at: datetime | None
    is_deleted: bool
    deleted_at: datetime | None
    created_at:datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedMessagesResponse(BaseModel):
    items: list[MessageListItem]
    next_cursor: str | None = None
    has_more: bool = False

class MessageUpdate(BaseModel):
    content:str = Field(min_length=1, max_length=4000)
    socket_id: str | None = None

class EditMessageEvent(BaseModel):
    message_id: uuid.UUID
    content: str = Field(min_length=1, max_length=4000)

class MessageDelete(BaseModel):
    socket_id: str | None = None
