import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.participant import Participant

def create_message(
    db: Session,
    conversation_id: uuid.UUID,
    sender_id: uuid.UUID,
    content: str,
):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    participant = (
        db.query(Participant)
        .filter(
            Participant.conversation_id == conversation_id,
            Participant.user_id == sender_id,
        )
        .first()
    )

    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this conversation",
        )

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