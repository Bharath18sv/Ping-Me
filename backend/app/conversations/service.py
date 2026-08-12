import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.conversations.repository import ConversationRepository
from app.conversations.schemas import ConversationListItem
from app.redis.client import redis_client
from app.redis.socket_repository import SocketRepository

socket_repo = SocketRepository(redis_client)


async def create_or_get_conversation(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    other_user_id: uuid.UUID,
):
    other_user = await ConversationRepository.get_user_by_id(db, other_user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user_id == other_user_id:
        raise HTTPException(
            status_code=400, detail="You cannot create a conversation with yourself"
        )

    existing_conversation = await ConversationRepository.get_direct_conversation(
        db, current_user_id, other_user_id
    )

    is_new = existing_conversation is None

    conversation = existing_conversation or await ConversationRepository.create_direct_conversation(
        db, current_user_id, other_user_id
    )

    if is_new:
        from app.sockets.rooms import join_conversation_rooms
        from app.sockets.server import sio

        # New conversation — currently-connected sockets for both participants
        # were never told about it at connect time, so join them now.
        for uid in (current_user_id, other_user_id):
            sids = await socket_repo.get_sockets(str(uid))
            for sid in sids:
                await join_conversation_rooms(sid, [conversation.id])

        # Notify the recipient (other_user_id) about the new conversation with creator as other_user
        creator_user = await ConversationRepository.get_user_by_id(db, current_user_id)
        if creator_user:
            recipient_payload_data = {
                "id": conversation.id,
                "is_group": conversation.is_group,
                "name": conversation.name,
                "created_at": conversation.created_at,
                "updated_at": conversation.updated_at,
                "other_user": creator_user,
                "last_message": None,
                "unread_count": 0,
            }
            recipient_item = ConversationListItem.model_validate(recipient_payload_data)
            recipient_json = recipient_item.model_dump(mode="json")

            recipient_sids = await socket_repo.get_sockets(str(other_user_id))
            for sid in recipient_sids:
                await sio.emit("conversation_new", recipient_json, to=sid)

    return {
        "id": conversation.id,
        "is_group": conversation.is_group,
        "name": conversation.name,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "other_user": other_user,       # already fetched above — no extra query needed
        "last_message": None,           # brand-new or existing-but-empty conversation
        "unread_count": 0,              # new conversation, or freshly opened
    }


async def get_conversations(
    db: AsyncSession,
    current_user_id: uuid.UUID,
):
    conversations = await ConversationRepository.get_conversations(db, current_user_id)
    return [
        {
            "id": conversation.id,
            "is_group": conversation.is_group,
            "name": conversation.name,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
            "other_user": user,
            "last_message": last_message,
            "unread_count": unread_count,
        }
        for conversation, user, last_message, unread_count in conversations
    ]


async def mark_conversation_as_read(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
):
    conversation = await ConversationRepository.get_conversation_by_id(
        db, conversation_id
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    participant = await ConversationRepository.get_participant(
        db, conversation_id, user_id
    )

    if not participant:
        raise HTTPException(
            status_code=403, detail="You are not a participant of this conversation"
        )

    message_ids = await ConversationRepository.mark_as_read(
        db, conversation_id, user_id
    )

    return message_ids