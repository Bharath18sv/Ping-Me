from app.core.config import settings
import socketio

manager = socketio.AsyncRedisManager(
    settings.REDIS_URL
)

sio = socketio.AsyncServer(
    async_mode="asgi",
    client_manager=manager,
    cors_allowed_origins=settings.CORS_ORIGINS,
    logger=True,
    engineio_logger=True
)

socket_app = socketio.ASGIApp(
    socketio_server=sio,
)

from app.sockets import handlers