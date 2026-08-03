import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.messages.repository import MessageRepository
from app.conversations.repository import ConversationRepository

async def create_message(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    sender_id: uuid.UUID,
    content: str,
):
    conversation = await ConversationRepository.get_conversation_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=403, detail="Conversation not found")

    participant = await ConversationRepository.get_participant(db, conversation_id, sender_id)

    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this conversation")

    return await MessageRepository.create_message(db, conversation_id, sender_id, content, conversation)

async def get_messages(
    db:AsyncSession,
    conversation_id:uuid.UUID,
    user_id:uuid.UUID,
    cursor:uuid.UUID | None,
    limit:int
):
    # first check the user has a conversation and whether he's a part of it
    conversation = await ConversationRepository.get_conversation_by_id(db, conversation_id)

    if not conversation:
        raise HTTPException(
            status_code=403,
            detail="Conversation not found"
        )
    
    participant = await ConversationRepository.get_participant(db, conversation_id, user_id)

    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a part of this conversation"
        )
    
    return await MessageRepository.get_messages(
        db, 
        conversation_id,
        cursor,
        limit
    )

async def edit_message(
    db: AsyncSession,
    message_id: uuid.UUID,
    user_id: uuid.UUID,
    content: str,
):
    message = await MessageRepository.get_message_by_id(
        db=db,
        message_id=message_id,
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message not found",
        )

    participant = await ConversationRepository.get_participant(
        db=db,
        conversation_id=message.conversation_id,
        user_id=user_id,
    )

    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this conversation",
        )

    if message.sender_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own messages",
        )

    content = content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    return await MessageRepository.update_message(
        db=db,
        message=message,
        content=content,
    )

async def delete_message(
    db: AsyncSession,
    message_id: uuid.UUID,
    user_id: uuid.UUID,
):
    message = await MessageRepository.get_message_by_id(
        db=db,
        message_id=message_id,
    )

    if not message:
        raise HTTPException(
            status_code=404,
            detail="Message not found",
        )

    participant = await ConversationRepository.get_participant(
        db=db,
        conversation_id=message.conversation_id,
        user_id=user_id,
    )

    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this conversation",
        )

    if message.sender_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own messages",
        )

    if message.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Message already deleted",
        )

    return await MessageRepository.soft_delete_message(
        db=db,
        message=message,
    )