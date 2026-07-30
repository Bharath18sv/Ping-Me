import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.conversations.repository import ConversationRepository

async def create_or_get_conversation(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    other_user_id: uuid.UUID,
):
    other_user = await ConversationRepository.get_user_by_id(db, other_user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if current_user_id == other_user_id:
        raise HTTPException(status_code=400, detail="You cannot create a conversation with yourself")

    existing_conversation = await ConversationRepository.get_direct_conversation(db, current_user_id, other_user_id)
    if existing_conversation:
        return existing_conversation
    
    return await ConversationRepository.create_direct_conversation(db, current_user_id, other_user_id)

async def get_conversations(
    db: AsyncSession,
    current_user_id: uuid.UUID,
):
    conversations = await ConversationRepository.get_conversations(db, current_user_id)
    return [
        {
            "id": conversation.id,
            "is_group": conversation.is_group,
            "name": conversation.name,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
            "other_user": user,
            "last_message": last_message,
            "unread_count": unread_count
        }
        for conversation, user, last_message, unread_count in conversations
    ]

async def mark_conversation_as_read(
    db:AsyncSession,
    conversation_id:uuid.UUID,
    user_id:uuid.UUID
):
    conversation = await ConversationRepository.get_conversation_by_id(
        db,
        conversation_id
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )
    
    participant = await ConversationRepository.get_participant(db, conversation_id, user_id)

    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this conversation"
        )

    await ConversationRepository.mark_as_read(
        db, 
        conversation_id, 
        user_id
    )