import logging

from app.sockets.server import sio
from app.sockets.auth import authenticate_socket
from app.sockets.rooms import join_conversation_rooms

from app.redis.client import redis_client
from app.redis.socket_repository import SocketRepository

from app.conversations.repository import ConversationRepository

from app.db.database import AsyncSessionLocal

socket_repo = SocketRepository(redis_client)

logger = logging.getLogger(__name__)

@sio.event
async def connect(sid, environ, auth):
    if auth is None or "token" not in auth:
        raise ConnectionRefusedError("Missing Token")

    user_id = authenticate_socket(auth["token"])

    await sio.save_session(
        sid,
        {
            "user_id" : user_id
        }
    )

    # add socket to redis
    await socket_repo.add_socket(
        str(user_id),
        sid
    )

    socket_count = await socket_repo.socket_count(str(user_id))

    # only emit online if the user is online for the first time, if the count is more than 1, no need to emit
    if socket_count == 1:
        await sio.emit(
            "user_online",
            {
                "user_id" : str(user_id)
            }
        )

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

    socket_count = await socket_repo.socket_count(
        str(session["user_id"])
    )

    if socket_count == 0:
        await sio.emit(
            "user_offline",
            {
                "user_id": str(session["user_id"]),
            },
        )

    # remove socket from redis
    await socket_repo.remove_socket(
        str(session.get("user_id")),
        sid
    )

    logger.info("Socket disconnected: %s (%s)", sid, session.get("user_id"))

from app.messages.socket_schemas import SendMessageEvent,TypingEvent
from app.messages.service import create_message
from app.messages.schemas import MessageResponse

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

from app.messages.socket_schemas import MessageDeliveredEvent

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
