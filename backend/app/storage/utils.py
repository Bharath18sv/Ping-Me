import uuid

from pathlib import Path

async def build_s3_key(
    user_id:uuid.UUID,
    conversation_id:uuid.UUID,
    file_name:str
)-> str:
    extension = Path(file_name).suffix.lower()

    file_id = uuid.uuid4()

    return (
        f"users/{user_id}/"
        f"conversations/{conversation_id}/"
        f"{file_id}{extension}"
    )