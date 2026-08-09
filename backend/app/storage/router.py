import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.dependencies import get_db
from app.db.models.user import User

from app.storage.schemas import (
    UploadRequest,
    UploadResponse,
)

from app.storage.service import create_upload


router = APIRouter()


@router.post(
    "/conversations/{conversation_id}/attachments/upload",
    response_model=UploadResponse,
)
async def create_attachment_upload(
    conversation_id: uuid.UUID,
    payload: UploadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_upload(
        db=db,
        user_id=current_user.id,
        conversation_id=conversation_id,
        payload=payload,
    )