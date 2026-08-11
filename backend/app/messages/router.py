import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.dependencies import get_db
from app.db.models.user import User
from app.sockets.server import sio

from app.messages.schemas import (
    MessageCreate,
    MessageResponse,
    MessageListItem,
    PaginatedMessagesResponse,
    MessageUpdate,
)
from app.messages.service import create_message, get_messages, edit_message, delete_message

router = APIRouter()

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = await create_message(
        db=db,
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=payload.content
    )
    
    response = MessageResponse.model_validate(message)
    
    await sio.emit(
        "message_new",
        response.model_dump(mode="json"),
        room=f"conversation:{conversation_id}"
    )

    return response

@router.get("/conversations/{conversation_id}/messages", response_model=PaginatedMessagesResponse)
async def list_messages(
    conversation_id: uuid.UUID,
    cursor: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        cursor=cursor,
        limit=limit
    )

@router.patch(
    "/messages/{message_id}",
    response_model=MessageResponse,
)
async def update_message(
    message_id: uuid.UUID,
    payload: MessageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await edit_message(
        db=db,
        message_id=message_id,
        user_id=current_user.id,
        content=payload.content,
    )

@router.delete(
    "/messages/{message_id}",
    response_model=MessageResponse,
)
async def remove_message(
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await delete_message(
        db=db,
        message_id=message_id,
        user_id=current_user.id,
    )