import uuid
from jose import JWTError
from app.auth.jwt import decode_token


def authenticate_socket(token: str) -> uuid.UUID:
    if not token:
        raise ConnectionRefusedError("Authentication required")

    payload = decode_token(token)

    if payload is None:
        raise ConnectionRefusedError("Invalid authentication token")

    if payload.get("type") != "access":
        raise ConnectionRefusedError("Invalid token type")

    try:
        sub = payload.get("sub")
        if not sub:
            raise ConnectionRefusedError("Invalid token payload")
        return uuid.UUID(sub)
    except (KeyError, ValueError, JWTError):
        raise ConnectionRefusedError("Invalid authentication token")
