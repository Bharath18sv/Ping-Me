import uuid
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func

from app.db.models.conversation import Conversation
from app.db.models.participant import Participant
from app.db.models.user import User

class ConversationRepository:
    @staticmethod
    def get_user_by_id(db: Session, user_id: uuid.UUID):
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_direct_conversation(db: Session, current_user_id: uuid.UUID, other_user_id: uuid.UUID):
        return (
            db.query(Conversation)
            .join(Participant, Conversation.id == Participant.conversation_id)
            .filter(
                Conversation.is_group == False,
                Participant.user_id.in_([current_user_id, other_user_id]),
            )
            .group_by(Conversation.id)
            .having(func.count(Participant.user_id) == 2)
            .first()
        )

    @staticmethod
    def create_direct_conversation(db: Session, current_user_id: uuid.UUID, other_user_id: uuid.UUID):
        conversation = Conversation(is_group=False)
        db.add(conversation)
        db.flush()

        participants = [
            Participant(conversation_id=conversation.id, user_id=current_user_id),
            Participant(conversation_id=conversation.id, user_id=other_user_id),
        ]
        db.add_all(participants)
        db.commit()
        db.refresh(conversation)
        return conversation

    @staticmethod
    def get_conversations(db: Session, current_user_id: uuid.UUID):
        other = aliased(Participant)
        return (
            db.query(Conversation, User)
            .join(Participant, Conversation.id == Participant.conversation_id)
            .join(other, Conversation.id == other.conversation_id)
            .join(User, User.id == other.user_id)
            .filter(
                Participant.user_id == current_user_id,
                other.user_id != current_user_id,
                Conversation.is_group == False,
            )
            .order_by(Conversation.updated_at.desc())
            .all()
        )
