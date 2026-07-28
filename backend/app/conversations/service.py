import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.conversations.repository import ConversationRepository

def create_or_get_conversation(
    db: Session,
    current_user_id: uuid.UUID,
    other_user_id: uuid.UUID,
):
    other_user = ConversationRepository.get_user_by_id(db, other_user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if current_user_id == other_user_id:
        raise HTTPException(status_code=400, detail="You cannot create a conversation with yourself")

    existing_conversation = ConversationRepository.get_direct_conversation(db, current_user_id, other_user_id)
    if existing_conversation:
        return existing_conversation
    
    return ConversationRepository.create_direct_conversation(db, current_user_id, other_user_id)

def get_conversations(
    db: Session,
    current_user_id: uuid.UUID,
):
    conversations = ConversationRepository.get_conversations(db, current_user_id)
    return [
        {
            "id": conversation.id,
            "is_group": conversation.is_group,
            "name": conversation.name,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
            "other_user": user,
        }
        for conversation, user in conversations
    ]