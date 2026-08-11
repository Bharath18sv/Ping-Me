import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update

from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.participant import Participant

from datetime import datetime, timezone

class MessageRepository:

    async def create_message(db: AsyncSession, conversation_id: uuid.UUID, sender_id: uuid.UUID, content: str, conversation: Conversation):
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
        )
        db.add(message)
        
        # Update conversation activity
        # changed from message.updated_at to func.now()
        conversation.updated_at = func.now()
        
        await db.flush()
        await db.commit()
        await db.refresh(message)
        return message
    
    async def get_messages(
        db: AsyncSession, 
        conversation_id: uuid.UUID, 
        cursor: uuid.UUID | None = None,
        limit: int = 50
    ):
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
        )

        if cursor:
            cursor_result = await db.execute(
                select(Message)
                .where(
                    Message.id == cursor,
                    Message.conversation_id == conversation_id
                )
            )
            cursor_message = cursor_result.scalar_one_or_none()

            if cursor_message:
                stmt = stmt.where(
                    Message.created_at < cursor_message.created_at
                )

        # Fetch limit + 1 to determine if more items exist for cursor pagination
        stmt = (
            stmt.order_by(desc(Message.created_at))
            .limit(limit + 1)
        )

        result = await db.execute(stmt)
        messages = list(result.scalars().all())

        has_more = len(messages) > limit
        if has_more:
            items = messages[:limit]
            next_cursor = str(items[-1].id)
        else:
            items = messages
            next_cursor = None

        return {
            "items": items,
            "next_cursor": next_cursor,
            "has_more": has_more,
        }
    
    async def get_message_by_id(
        db:AsyncSession,
        message_id:uuid.UUID
    ):
        result =  await db.execute(
            select(Message)
            .where(
                Message.id == message_id
            )
        )
        return result.scalar_one_or_none()
    
    async def update_message(
        db: AsyncSession,
        message: Message,
        content: str,
    ):
        message.content = content
        message.is_edited = True
        message.edited_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(message)

        return message
        
    async def soft_delete_message(
        db: AsyncSession,
        message: Message,
    ):
        # content becomes like this (in db)
        message.content = null
        message.is_deleted = True
        message.deleted_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(message)

        return message     
