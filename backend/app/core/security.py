from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# this tells passlib use bcrypt for hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

# helper to hash the password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# helper to verify the password
def verify_password(plain_passw:str, hashed_passw:str) -> bool:
    return pwd_context.verify(plain_passw, hashed_passw)

# helper to create access token
def create_access_token(user_id:str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub" : str(user_id), #converted the uuid object into a string
        "exp" : expire,
        "type" : "access"
    }

    return jwt.encode(payload, key=settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

# helper to create refresh token
def create_refresh_token(user_id:str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub" : str(user_id), #converted the uuid object into a string
        "exp" : expire,
        "type" : "refresh"
    }

    return jwt.encode(payload, key=settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

# helper to decode the token
def decode_token(token:str):
    try:
        payload = jwt.decode(token, key=settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None




