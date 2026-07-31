import logging

from app.sockets.server import sio
from app.sockets.auth import authenticate_socket

from app.redis.client import redis_client
from app.redis.socket_repository import SocketRepository
from app.sockets.rooms import join_conversation_rooms

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

    # remove socket from redis
    await socket_repo.remove_socket(
        str(session.get("user_id")),
        sid
    )

    logger.info("Socket disconnected: %s (%s)", sid, session.get("user_id"))