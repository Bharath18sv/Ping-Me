import uuid

from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic

# {
#     "user_id": "3efc8f59-77a5-4f59-9d56-c7a35e7cb8a8"
# }
class ConversationCreate(BaseModel):
    user_id: uuid.UUID

class ConversationResponse(BaseModel):
    id: uuid.UUID
    is_group: bool
    name: str | None
    created_at: datetime
    updated_at: datetime

    # this internally converts sql alchemy model objects into JSON objects
    model_config = ConfigDict(from_attributes=True)

class ConversationListItem(BaseModel):
    id: uuid.UUID
    is_group: bool
    name: str | None
    other_user: UserPublic | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)