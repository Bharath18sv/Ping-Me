from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.db.dependencies import get_db
from app.users.schemas import UserCreate, UserResponse
from app.auth.service import AuthService
from app.users.service import get_user_by_id
from app.auth.jwt import decode_token, create_access_token
from app.auth.schemas import LoginRequest, Token
from app.auth.dependencies import get_current_user

router = APIRouter()

# Detect production environment for cross-site cookie policy
IS_PROD = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_STATIC_URL") or os.getenv("ENVIRONMENT") == "production")
COOKIE_SECURE = IS_PROD
COOKIE_SAMESITE = "none" if IS_PROD else "lax"


@router.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await AuthService.signup(db, user)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/login", response_model=dict)
async def login(
    user: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        token = await AuthService.login(db, user)

        response.set_cookie(
            key="access_token",
            value=token.access_token,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            max_age=15 * 60,
            path="/",
        )

        response.set_cookie(
            key="refresh_token",
            value=token.refresh_token,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            max_age=7 * 24 * 60 * 60,
            path="/",
        )

        return {
            "message": "Login successful"
        }

    except HTTPException as he:
        raise he

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/refresh")
async def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = create_access_token(user_id)

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=15 * 60,
        path="/",
    )

    return {"message": "Token refreshed successfully"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        "access_token",
        path="/",
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )
    response.delete_cookie(
        "refresh_token",
        path="/",
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user
