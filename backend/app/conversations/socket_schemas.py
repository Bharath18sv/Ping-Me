import uuid
from pydantic import BaseModel


class ConversationReadEvent(BaseModel):
    conversation_id: uuid.UUID