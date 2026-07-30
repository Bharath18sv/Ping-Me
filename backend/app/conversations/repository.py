import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased
from sqlalchemy import func, select

from app.db.models.conversation import Conversation
from app.db.models.participant import Participant
from app.db.models.user import User

class ConversationRepository:
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID):
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_direct_conversation(db: AsyncSession, current_user_id: uuid.UUID, other_user_id: uuid.UUID):
        result = await db.execute(
            select(Conversation)
            .join(Participant, Conversation.id == Participant.conversation_id)
            .where(
                Conversation.is_group == False,
                Participant.user_id.in_([current_user_id, other_user_id]),
            )
            .group_by(Conversation.id)
            .having(func.count(Participant.user_id) == 2)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_direct_conversation(db: AsyncSession, current_user_id: uuid.UUID, other_user_id: uuid.UUID):
        conversation = Conversation(is_group=False)
        db.add(conversation)
        await db.flush()

        participants = [
            Participant(conversation_id=conversation.id, user_id=current_user_id),
            Participant(conversation_id=conversation.id, user_id=other_user_id),
        ]
        db.add_all(participants)
        await db.commit()
        await db.refresh(conversation)
        return conversation

    @staticmethod
    async def get_conversations(db: AsyncSession, current_user_id: uuid.UUID):
        other = aliased(Participant)
        result = await db.execute(
            select(Conversation, User)
            .join(Participant, Conversation.id == Participant.conversation_id)
            .join(other, Conversation.id == other.conversation_id)
            .join(User, User.id == other.user_id)
            .where(
                Participant.user_id == current_user_id,
                other.user_id != current_user_id,
                Conversation.is_group == False,
            )
            .order_by(Conversation.updated_at.desc())
        )
        return result.all()
