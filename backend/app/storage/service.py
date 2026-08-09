import uuid
from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

from app.storage.s3 import head_object, generate_upload_url
from app.storage.repository import AttachmentRepository
from app.conversations.repository import ConversationRepository
from app.storage.schemas import UploadRequest
from app.storage.utils import build_s3_key

from botocore.exceptions import ClientError

#50 MB max file size
MAX_FILE_SIZE = 50 * 1024 * 1024 

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
}

async def create_upload(
    db: AsyncSession,
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

async def complete_upload(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
    s3_key: str,
    file_name: str,
    content_type: str,
):
    # 1. Verify conversation exists
    conversation = await ConversationRepository.get_conversation_by_id(
        db=db,
        conversation_id=conversation_id,
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    # 2. Verify user is a participant
    participant = await ConversationRepository.get_participant(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this conversation",
        )

    # 3. Verify the S3 key belongs to this user and conversation
    expected_prefix = (
        f"users/{user_id}/"
        f"conversations/{conversation_id}/"
    )

    if not s3_key.startswith(expected_prefix):
        raise HTTPException(
            status_code=403,
            detail="Invalid S3 object key",
        )

    # 4. Verify the requested content type is allowed
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type",
        )

    # 5. Verify that the object actually exists in S3
    try:
        response = await head_object(s3_key)

    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")

        if error_code in {"404", "NoSuchKey", "NotFound"}:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file was not found in S3",
            ) from exc

        raise HTTPException(
            status_code=502,
            detail="Unable to verify uploaded file",
        ) from exc

    # 6. Trust S3's actual object size
    actual_size = response["ContentLength"]

    if actual_size <= 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    if actual_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File size must be less than "
                f"{MAX_FILE_SIZE / 1024 / 1024:g} MB"
            ),
        )

    # 7. Trust the metadata returned by S3
    actual_content_type = response.get("ContentType")

    if actual_content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported uploaded file type",
        )

    # 8. Verify that the uploaded object's content type matches
    #    what the client originally requested.
    if actual_content_type != content_type:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file content type does not match",
        )

    # 9. Create the persistent attachment record
    attachment = await AttachmentRepository.create(
        db=db,
        conversation_id=conversation_id,
        user_id=user_id,
        file_name=file_name,
        content_type=actual_content_type,
        file_size=actual_size,
        s3_key=s3_key,
    )

    return attachment