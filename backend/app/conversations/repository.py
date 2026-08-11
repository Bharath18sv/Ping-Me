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

        latest_message_subquery = (
            select(
                Message.id.label("message_id"),
                Message.conversation_id.label("conversation_id"),
                func.row_number()
                .over(
                    partition_by=Message.conversation_id,
                    order_by=[Message.created_at.desc(), Message.id.desc()],
                )
                .label("rn"),
            )
            .where(Message.deleted_at == None)
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
                Message.deleted_at == None,
                current_participant.user_id == current_user_id,
                Message.sender_id != current_user_id,
                or_(
                    current_participant.last_read_at == None,
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
                latest_message_subquery,
                (latest_message_subquery.c.conversation_id == Conversation.id)
                & (latest_message_subquery.c.rn == 1),
            )
            .outerjoin(
                last_message,
                last_message.id == latest_message_subquery.c.message_id,
            )
            .outerjoin(
                unread_counts,
                unread_counts.c.conversation_id == Conversation.id,
            )
            .where(
                Participant.user_id == current_user_id,
                other.user_id != current_user_id,
                Conversation.is_group == False
            )
            .order_by(Conversation.updated_at.desc())
        )

        return result.all()

    async def mark_as_read(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
    ):
        participant_result = await db.execute(
            select(Participant)
            .where(
                Participant.user_id == user_id,
                Participant.conversation_id == conversation_id,
            )
        )

        participant = participant_result.scalar_one_or_none()

        if not participant:
            raise HTTPException(
            status_code=403,
            detail="You are not a participant of this conversation",
        )

        if participant.last_read_at is None:
            result = await db.execute(
                select(Message.id)
                .where(
                    Message.conversation_id == conversation_id,
                    Message.deleted_at.is_(None),
                    Message.sender_id != user_id,
                )
            )
        else:
            result = await db.execute(
                select(Message.id)
                .where(
                    Message.conversation_id == conversation_id,
                    Message.deleted_at.is_(None),
                    Message.sender_id != user_id,
                    Message.created_at > participant.last_read_at,
                )
            )

        message_ids = result.scalars().all()

        await db.execute(
            update(Participant)
            .where(
                Participant.conversation_id == conversation_id,
                Participant.user_id == user_id,
            )
            .values(last_read_at=func.now())
        )

        await db.commit()

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
        
