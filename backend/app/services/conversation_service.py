import uuid

from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.conversation import Conversation
from app.models.participants import Participant
from app.models.user import User

def create_or_get_conversation(
    db: Session,
    current_user_id: uuid.UUID,
    other_user_id: uuid.UUID,
):
    # check if there's already a direct conversation
    other_user = (
        db.query(User)
        .filter(User.id == other_user_id)
        .first()
    )

    if not other_user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    
    # stop chatting with yourself
    if current_user_id == other_user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot create a conversation with yourself",
        )
    
    # check if an existing conversation exist
    existing_conversation = (
        db.query(Conversation)
        .join(
            Participant,
            Conversation.id == Participant.conversation_id,
        )
        .filter(
            Conversation.is_group == False,
            Participant.user_id.in_([current_user_id, other_user_id]),
        )
        .group_by(Conversation.id)
        .having(func.count(Participant.user_id) == 2)
        .first()
    )

    if existing_conversation:
        return existing_conversation
    
    # create conversation if it does not exist
    conversation = Conversation(
        is_group=False,
    )

    db.add(conversation)
    db.flush()  # Generates conversation.id without committing

    # add both into participants of the new conversation to the participants table
    participants = [
        Participant(
            conversation_id=conversation.id,
            user_id=current_user_id,
        ),
        Participant(
            conversation_id=conversation.id,
            user_id=other_user_id,
        ),
    ]

    db.add_all(participants)
    db.commit()
    db.refresh(conversation)

    return conversation
    