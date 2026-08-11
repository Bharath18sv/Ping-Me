from fastapi import HTTPException, Depends, Cookie
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import decode_token
from app.db.dependencies import get_db
from app.users.service import get_user_by_id

# The security object is used to extract the token from the request header.
# It is a dependency that will be called by the router.
# security = HTTPBearer()

async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    payload = decode_token(access_token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token."
        )

    if payload["type"] != "access":
        raise HTTPException(
            status_code=401,
            detail="Invalid Token."
        )

    user = await get_user_by_id(
        db,
        payload["sub"]
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    return user