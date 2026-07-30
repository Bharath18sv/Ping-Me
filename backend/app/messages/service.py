import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.messages.repository import MessageRepository

async def create_message(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    sender_id: uuid.UUID,
    content: str,
):
    conversation = await MessageRepository.get_conversation_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    participant = await MessageRepository.get_participant(db, conversation_id, sender_id)

    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this conversation")

    return await MessageRepository.create_message(db, conversation_id, sender_id, content, conversation)

async def get_messages(
    db:AsyncSession,
    conversation_id:uuid.UUID,
    user_id:uuid.UUID
):
    # first check the user has a conversation and whether he's a part of it
    conversation = await MessageRepository.get_conversation_by_id(db, conversation_id)

    if not conversation:
        raise HTTPException(
            status_code=403,
            detail="Conversation not found"
        )
    
    participant = await MessageRepository.get_participant(db, conversation_id, user_id)

    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a part of this conversation"
        )
    
    return await MessageRepository.get_messages(db, conversation_id)