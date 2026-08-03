import uuid

from app.auth.jwt import decode_token

def authenticate_socket(token:str) -> uuid.UUID:
    payload = decode_token(token)

    if payload is None:
        raise ConnectionRefusedError("Invalid Token")
    
    if payload.get("type") != 'access':
        raise ConnectionRefusedError("Invalid Token type")
    
    try:
        return uuid.UUID(payload["sub"])
    except (KeyError, ValueError, JWTError):
        raise ConnectionRefusedError("Invalid Token")

