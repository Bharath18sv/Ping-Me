import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, update, and_, or_
from sqlalchemy.orm import aliased

from app.db.models.conversation import Conversation
from app.db.models.participant import Participant
from app.db.models.user import User

from app.db.models.message import Message

class ConversationRepository:
    async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID):
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

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

    async def get_conversations(db: AsyncSession, current_user_id: uuid.UUID):
        # we need participant twice - for current and other
        other = aliased(Participant)

        current_participant = aliased(Participant)

        latest_message = (
            # select latest message with max created_at timestamp
            select(
                Message.conversation_id,
                # rename column from max_1 to the given 
                func.max(Message.created_at).label("latest_created_at")
            )
            .group_by(Message.conversation_id)
            .subquery()
        )

        last_message = aliased(Message)

        # unread count
        unread_counts = (
            select(
                Message.conversation_id,
                func.count(Message.id).label("unread_count"),
            )
            .join(
                current_participant,
                current_participant.conversation_id == Message.conversation_id,
            )
            .where(
                current_participant.user_id == current_user_id,
                or_(
                    current_participant.last_read_at.is_(None),
                Message.created_at > current_participant.last_read_at,
            ),
        )
        .group_by(Message.conversation_id)
        .subquery()
    )

        result = await db.execute(
            select(
                Conversation, 
                User,
                last_message,
                func.coalesce(
                    unread_counts.c.unread_count,
                    0,
                ).label("unread_count"),
            )
            .join(
                Participant, 
                Conversation.id == Participant.conversation_id
            )
            .join(
                other, 
                Conversation.id == other.conversation_id
            )
            .join(
                User, 
                User.id == other.user_id
            )
            .outerjoin(
                latest_message,
                # .c means the columns in the subquery
                latest_message.c.conversation_id == Conversation.id
            )
            .outerjoin(
                last_message,
                (
                    last_message.conversation_id == latest_message.c.conversation_id
                ) & (
                    last_message.created_at == latest_message.c.latest_created_at
                ),
            )
            .outerjoin(
                unread_counts,
                unread_counts.c.conversation_id == Conversation.id,
            )
            .where(
                Participant.user_id == current_user_id,
                other.user_id != current_user_id,
                Conversation.is_group.is_(False)
            )
            .order_by(Conversation.updated_at.desc())
        )

        return result.all()

    async def mark_as_read(
        db:AsyncSession, 
        conversation_id:uuid.UUID, 
        user_id:uuid.UUID
    ):
        #get the participant
        participant = await db.execute(
            select(Participant)
            .where(
                Participant.user_id == user_id,
                Participant.conversation_id == conversation_id,
            )
        )

        participant = participant.scalar_one()
        
        # fetch unread messages
        result = await db.execute(
            select(Message.id)
            .where(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                (
                    (participant.last_read_at.is_(None)) 
                    | Message.created_at > participant.last_read_at
                )
            )
        )
        
        message_ids = result.scalars().all()
        
        # update last read for the conversation for the user who is marking as read
        await db.execute(
            update(Participant)
            .where(
                Participant.conversation_id == conversation_id,
                Participant.user_id == user_id
            )
            .values(last_read_at=func.now())
        )

        await db.commit()
        # message ids used for marking msgs as read
        return message_ids
    
    async def get_conversation_by_id(
        db:AsyncSession,
        conversation_id:uuid.UUID
    ):
        result =  await db.execute(
            select(
                Conversation
            )
            .where(Conversation.id == conversation_id)
        )

        return result.scalar_one_or_none()
    
    async def get_participant(
        db:AsyncSession,
        conversation_id:uuid.UUID,
        user_id:uuid.UUID
    ):
        result = await db.execute(
            select(Participant)
            .where(
                Participant.conversation_id == conversation_id,
                Participant.user_id == user_id
            )
        )

        return result.scalar_one_or_none()

    async def get_user_conversation_ids(
        db:AsyncSession,
        user_id:uuid.UUID
    ):
        # make sure to use await
        result = await db.execute(
            select(Participant.conversation_id)
            .where(Participant.user_id == user_id)
        )

        return result.scalars().all()
        
