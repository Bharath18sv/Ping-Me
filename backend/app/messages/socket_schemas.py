from pydantic import BaseModel, Field
import uuid

class SendMessageEvent(BaseModel):
    conversation_id: uuid.UUID
    content: str = Field(min_length=1, max_length=4000)

class TypingEvent(BaseModel):
    conversation_id: uuid.UUID

class MessageDeliveredEvent(BaseModel):
    conversation_id: uuid.UUID
    message_ids: list[uuid.UUID]

class DeleteMessageEvent(BaseModel):
    message_id: uuid.UUID