import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.participant import Participant

class MessageRepository:
    # duplicated from conversation repository
    # @staticmethod
    # async def get_conversation_by_id(db: AsyncSession, conversation_id: uuid.UUID):
    #     result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    #     return result.scalar_one_or_none()

    # @staticmethod
    # async def get_participant(db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID):
        # result = await db.execute(
        #     select(Participant).where(
        #         Participant.conversation_id == conversation_id,
        #         Participant.user_id == user_id,
        #     )
        # )
        # return result.scalar_one_or_none()

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
        db:AsyncSession, 
        conversation_id: uuid.UUID, 
        cursor:uuid.UUID | None=None,
        limit:int = 50):

        # SQL Alchemy query to get all the messages of this conversation
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
        )

        if cursor:
            # db.execute returns the objects which contains rows from db
            # select the cursor message (the message from which we need to retrieve the old messages)
            cursor_result = await db.execute(
                select(Message)
                .where(Message.id == cursor)
            )

            # return only one row or none
            cursor_message = cursor_result.scalar_one_or_none()

            # if cursor message is found, then select all the messages before the cursor message
            if cursor_message:
                stmt = stmt.where(
                    Message.created_at < cursor_message.created_at
                )

        # latest message first
        stmt = (
            stmt.order_by(desc(Message.created_at))
            .limit(limit)
        )

        result = await db.execute(stmt)

        # # scalars() extract first column from each row
        # # all() converts ScalarResult into a python list
        # return result.scalars().all()
        return result.scalars().all()
        
        
