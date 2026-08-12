# app/sockets/broadcast.py
from app.sockets.server import sio

async def broadcast_to_conversation(
    event: str,
    conversation_id,
    payload: dict,
    exclude_socket_id: str | None = None,
):
    """
    Single source of truth for emitting conversation-scoped events.
    Always excludes the originating socket when provided, so REST-triggered
    mutations never echo back to the tab that made the request.
    """
    await sio.emit(
        event,
        payload,
        room=f"conversation:{conversation_id}",
        skip_sid=exclude_socket_id,
    )