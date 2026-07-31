import logging

from app.sockets.server import sio

logger = logging.getLogger(__name__)

async def join_conversation_rooms(
    sid:str,
    conversation_ids: list
):
    """
    Join all the conversation rooms
    """
    for conversation_id in conversation_ids:
        await sio.enter_room(
            sid,
            f"conversation:{conversation_id}"
        )

    logger.info(
            "Socket %s joined rooms %s",
            sid,
            conversation_ids,
        )
    