import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UploadRequest(BaseModel):
    file_name: str = Field(
        min_length=1,
        max_length=255,
    )
    content_type: str = Field(
        min_length=1,
        max_length=100,
    )
    file_size: int = Field(
        gt=0,
    )


class PresignedUpload(BaseModel):
    url: str
    fields: dict[str, str]


class UploadResponse(BaseModel):
    upload_url: PresignedUpload


class CompleteUploadRequest(BaseModel):
    s3_key: str = Field(
        min_length=1,
        max_length=1024,
    )
    file_name: str = Field(
        min_length=1,
        max_length=255,
    )
    content_type: str = Field(
        min_length=1,
        max_length=100,
    )


class AttachmentResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    uploaded_by: uuid.UUID
    file_name: str
    content_type: str
    file_size: int
    s3_key: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)