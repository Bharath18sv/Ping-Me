import socketio

sio = socketio.AsyncServer(
    async_mode="asgi",
    # add later
    cors_allowed_origins=[],
)

socket_app = socketio.ASGIApp(
    socketio_server=sio,
)

from app.sockets import handlers