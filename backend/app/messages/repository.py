import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.participant import Participant

class MessageRepository:

    @staticmethod
    async def get_conversation_by_id(db: AsyncSession, conversation_id: uuid.UUID):
        result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_participant(db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID):
        result = await db.execute(
            select(Participant).where(
                Participant.conversation_id == conversation_id,
                Participant.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
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
        
        await db.commit()
        await db.refresh(message)
        return message
    
    @staticmethod
    async def get_messages(db:AsyncSession, conversation_id: uuid.UUID, limit:int = 50):
        # db.execute returns the objects which contains rows from db
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
            .limit(limit)
        )
        # scalars() extract first column from each row
        # all() converts ScalarResult into a python list
        return result.scalars().all()
        
