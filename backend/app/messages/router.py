import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.dependencies import get_db
from app.messages.schemas import MessageCreate, MessageResponse, MessageListItem
from app.db.models.user import User
from app.messages.service import create_message, get_messages

router = APIRouter()

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    conversation_id: uuid.UUID,
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user:User = Depends(get_current_user)
):
    return await create_message(
        db=db,
        conversation_id = conversation_id,
        sender_id = current_user.id,
        content = payload.content
    )

@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageListItem])
async def list_messages(
    conversation_id:uuid.UUID,
    db:AsyncSession = Depends(get_db),
    current_user:User = Depends(get_current_user)
):
    return await get_messages(
        conversation_id=conversation_id,
        db=db,
        user_id=current_user.id
    )
    
