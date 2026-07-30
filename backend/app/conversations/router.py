from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.dependencies import get_db
from app.db.models.user import User
from app.conversations.schemas import (
    ConversationCreate,
    ConversationResponse,
    ConversationListItem
)
from app.conversations.service import create_or_get_conversation, get_conversations

router = APIRouter()

@router.post(
    "",
    response_model=ConversationResponse,
    status_code=201
    )
# we should always use non-default arguments first before using the default ones
async def create_conversation(
    payload: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user:User = Depends(get_current_user)):

    return await create_or_get_conversation(
        db=db,
        current_user_id=current_user.id,
        other_user_id=payload.user_id
    )

@router.get("", response_model=list[ConversationListItem])
async def list_conversations(db:AsyncSession = Depends(get_db), current_user:User = Depends(get_current_user)):
    return await get_conversations(db=db, current_user_id=current_user.id)