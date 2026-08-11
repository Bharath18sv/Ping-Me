import logging

from app.messages.socket_schemas import (
    SendMessageEvent,
    TypingEvent,
    MessageDeliveredEvent,
    DeleteMessageEvent,
)
from app.messages.service import create_message, edit_message, delete_message
from app.messages.schemas import MessageResponse, EditMessageEvent

from app.sockets.server import sio
from app.sockets.auth import authenticate_socket
from app.sockets.rooms import join_conversation_rooms

from app.redis.client import redis_client
from app.redis.socket_repository import SocketRepository

from app.conversations.repository import ConversationRepository

from app.db.database import AsyncSessionLocal


socket_repo = SocketRepository(redis_client)

logger = logging.getLogger(__name__)

from http.cookies import SimpleCookie

def _extract_token_from_environ(environ: dict) -> str:
    cookie_header = environ.get("HTTP_COOKIE")
    if not cookie_header:
        headers = environ.get("headers") or environ.get("asgi.scope", {}).get("headers", [])
        for item in headers:
            if isinstance(item, (tuple, list)) and len(item) == 2:
                name, value = item
                header_name = name.decode("utf-8") if isinstance(name, bytes) else str(name)
                if header_name.lower() == "cookie":
                    cookie_header = value.decode("utf-8") if isinstance(value, bytes) else str(value)
                    break

    if not cookie_header:
        raise ConnectionRefusedError("Authentication required")

    cookie = SimpleCookie()
    cookie.load(cookie_header)

    if "access_token" not in cookie:
        raise ConnectionRefusedError("Authentication required")

    token = cookie["access_token"].value
    if not token:
        raise ConnectionRefusedError("Authentication required")

    return token

@sio.event
async def connect(sid, environ, auth=None):
    token = _extract_token_from_environ(environ)
    user_id = authenticate_socket(token)

    await sio.save_session(
        sid,
        {
            "user_id": user_id
        }
    )

    user_id_str = str(user_id)

    # add socket to redis
    await socket_repo.add_socket(
        user_id_str,
        sid
    )

    socket_count = await socket_repo.socket_count(user_id_str)

    # Send current presence state to this socket
    online_user_ids = await socket_repo.get_online_users()

    await sio.emit(
        "presence_sync",
        {
            "user_ids":online_user_ids
        },
        to=sid
    )

    # Tell other clients this user came online
    # only emit online if the user is online for the first time
    if socket_count == 1:
        await sio.emit(
            "user_online",
            {
                "user_id": user_id_str
            },
            skip_sid=sid
        )

    # join conversation rooms
    async with AsyncSessionLocal() as db:
        conversation_ids = await ConversationRepository.get_user_conversation_ids(db, user_id)

    await join_conversation_rooms(
        sid,
        conversation_ids
    )

    logger.info("Socket connected: %s (%s)", sid, user_id)

@sio.event
async def disconnect(sid):

    session = await sio.get_session(sid)
    
    if not session or "user_id" not in session:
        logger.info("Socket disconnected without valid session: %s", sid)
        return

    user_id = str(session["user_id"])

    # 1. Remove socket from redis FIRST
    await socket_repo.remove_socket(user_id, sid)

    # 2. Check remaining socket count
    socket_count = await socket_repo.socket_count(user_id)

    # 3. If remaining count is 0, emit user_offline
    if socket_count == 0:
        await sio.emit(
            "user_offline",
            {
                "user_id": user_id,
            },
        )

    logger.info("Socket disconnected: %s (%s)", sid, user_id)

@sio.event
async def message_send(sid, data):
    # logger.info("message_send received")
    # logger.info(data)

    session = await sio.get_session(sid)

    payload = SendMessageEvent.model_validate(data)

    async with AsyncSessionLocal() as db:

        message = await create_message(
            db=db,
            conversation_id=payload.conversation_id,
            sender_id=session.get("user_id"),
            content=payload.content,
        )

        response = MessageResponse.model_validate(message)

    # emit this response to all the participants in the conversation
    await sio.emit(
        "message_new",
        response.model_dump(mode="json"),
        room=f"conversation:{payload.conversation_id}"
    )

@sio.event
async def typing_start(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get("user_id")

    payload = TypingEvent.model_validate(data)

    async with AsyncSessionLocal() as db:
        participant = await ConversationRepository.get_participant(
            db, 
            payload.conversation_id, 
            user_id
        )

        if not participant:
            return

    # emit this to all other participants in the conversation except the sender
    await sio.emit(
        "typing",
        {
            "conversation_id": str(payload.conversation_id),
            "user_id": str(session["user_id"]),
            "is_typing": True
        },
        room=f"conversation:{payload.conversation_id}",
        # don't send typing indicator to the sender
        skip_sid=sid
    )

@sio.event
async def typing_stop(sid, data):
    session = await sio.get_session(sid)

    payload = TypingEvent.model_validate(data)

    async with AsyncSessionLocal() as db:
        participant = await ConversationRepository.get_participant(
            db=db,
            conversation_id=payload.conversation_id,
            user_id=session["user_id"],
        )

    if not participant:
        return

    await sio.emit(
        "typing",
        {
            "conversation_id": str(payload.conversation_id),
            "user_id": str(session["user_id"]),
            "is_typing": False,
        },
        room=f"conversation:{payload.conversation_id}",
        skip_sid=sid,
    )

from app.conversations.socket_schemas import ConversationReadEvent
from app.conversations.service import mark_conversation_as_read
@sio.event
async def conversation_read(sid, data):
    session = await sio.get_session(sid)

    payload = ConversationReadEvent.model_validate(data)

    async with AsyncSessionLocal() as db:
        message_ids = await mark_conversation_as_read(
            db=db,
            conversation_id=payload.conversation_id,
            user_id=session["user_id"]
        )        
    
    # emit this to all the participants in the conversation
    await sio.emit(
        "message_read",
        {
            "conversation_id": str(payload.conversation_id),
            "message_ids": [str(mid) for mid in message_ids],
            "read_by": str(session["user_id"]),
        },
        room=f"conversation:{payload.conversation_id}"
    )

@sio.event
async def message_delivered(sid, data):
    # remember await
    session = await sio.get_session(sid)

    payload = MessageDeliveredEvent.validate(data)

    async with AsyncSessionLocal() as db:
        participant = await ConversationRepository.get_participant(
            db=db,
            conversation_id=payload.conversation_id,
            user_id=session["user_id"]
        )
    
    if not participant:
        return 
    
    await sio.emit(
        "messages_delivered",
        {
            "conversation_id" : str(payload.conversation_id),
            "message_ids" : [
                str(message_id) 
                for message_id in payload.message_ids
            ],
            "delivered_to": str(session["user_id"])
        },
        room=f"conversation:{payload.conversation_id}",
    )

@sio.event
async def message_edit(sid, data):
    session = await sio.get_session(sid)

    payload = EditMessageEvent.model_validate(data)

    async with AsyncSessionLocal() as db:
        message = await edit_message(
            db=db,
            message_id=payload.message_id,
            user_id=session["user_id"],
            content=payload.content,
        )

        response = MessageResponse.model_validate(message)

    await sio.emit(
        "message_updated",
        response.model_dump(mode="json"),
        room=f"conversation:{message.conversation_id}",
    )

@sio.event
async def message_delete(sid, data):
    session = await sio.get_session(sid)

    payload = DeleteMessageEvent.model_validate(data)

    async with AsyncSessionLocal() as db:
        message = await delete_message(
            db=db,
            message_id=payload.message_id,
            user_id=session["user_id"],
        )

        response = MessageResponse.model_validate(message)

    await sio.emit(
        "message_deleted",
        response.model_dump(mode="json"),
        room=f"conversation:{message.conversation_id}",
    )