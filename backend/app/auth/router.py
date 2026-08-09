from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.users.schemas import UserCreate, UserResponse
from app.auth.service import AuthService

from app.auth.schemas import LoginRequest, Token


router = APIRouter()

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
            secure=False,      # localhost development
            samesite="lax",
            max_age=15 * 60,
            path="/",
        )

        response.set_cookie(
            key="refresh_token",
            value=token.refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
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

from app.auth.dependencies import get_current_user

@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user
