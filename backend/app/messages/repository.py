import uuid
from sqlalchemy.orm import Session

from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.participant import Participant

class MessageRepository:

    @staticmethod
    def get_conversation_by_id(db: Session, conversation_id: uuid.UUID):
        return db.query(Conversation).filter(Conversation.id == conversation_id).first()

    @staticmethod
    def get_participant(db: Session, conversation_id: uuid.UUID, user_id: uuid.UUID):
        return db.query(Participant).filter(
            Participant.conversation_id == conversation_id,
            Participant.user_id == user_id,
        ).first()

    @staticmethod
    def create_message(db: Session, conversation_id: uuid.UUID, sender_id: uuid.UUID, content: str, conversation: Conversation):
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
        )
        db.add(message)
        
        # Update conversation activity
        conversation.updated_at = message.created_at
        
        db.commit()
        db.refresh(message)
        return message
