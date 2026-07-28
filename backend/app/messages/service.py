import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.messages.repository import MessageRepository

def create_message(
    db: Session,
    conversation_id: uuid.UUID,
    sender_id: uuid.UUID,
    content: str,
):
    conversation = MessageRepository.get_conversation_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    participant = MessageRepository.get_participant(db, conversation_id, sender_id)
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this conversation")

    return MessageRepository.create_message(db, conversation_id, sender_id, content, conversation)