import uuid

from datetime import datetime
from pydantic import BaseModel, ConfigDict

class MessageCreate(BaseModel):
    content:str

class MessageResponse(BaseModel):
    id:uuid.UUID
    conversation_id:uuid.UUID
    sender_id:uuid.UUID
    content:str
    is_edited:bool
    created_at:datetime

    model_config = ConfigDict(from_attributes=True)

class MessageListItem(BaseModel):
    id:uuid.UUID
    conversation_id:uuid.UUID
    sender_id:uuid.UUID
    content:str
    is_edited:bool
    created_at:datetime

    model_config = ConfigDict(from_attributes=True)


