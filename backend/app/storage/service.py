import uuid
from fastapi import HTTPException

from app.storage.s3 import generate_upload_url
from app.conversations.repository import ConversationRepository
from app.storage.schemas import UploadRequest
from app.storage.utils import build_s3_key

#50 MB max file size
MAX_FILE_SIZE = 50 * 1024 * 1024 

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
}

async def create_upload(
    db,
    user_id:uuid.UUID,
    conversation_id:uuid.UUID,
    payload: UploadRequest
):
    conversation = await ConversationRepository.get_conversation_by_id(
        db=db,
        conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )
    
    participant = await ConversationRepository.get_participant(
        db=db,
        conversation_id=conversation_id, 
        user_id=user_id
        )
    
    if not participant:
        raise HTTPException(
            status_code=403,
            detail="User not a participant in this conversation"
        )

    if payload.file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size must be less than {MAX_FILE_SIZE/1024/1024} MB"
        )

    if payload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )

    key = await build_s3_key(
        user_id=user_id,
        conversation_id=conversation_id,
        file_name=payload.file_name
    )

    upload_url = await generate_upload_url(
        key=key,
        content_type=payload.content_type,
        max_file_size=MAX_FILE_SIZE
    )

    return {
        "upload_url":upload_url,
        "key":key
    }