from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.schemas import UserCreate
from app.auth.schemas import LoginRequest, Token
from app.users.repository import UserRepository
from app.auth.jwt import create_access_token, create_refresh_token
from app.auth.passwords import verify_password

class AuthService:
    @staticmethod
    async def signup(db: AsyncSession, user: UserCreate):
        existing_user = await UserRepository.get_user_by_email(db, user.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists."
            )

        existing_username = await UserRepository.get_user_by_username(db, user.username)
        if existing_username:
            raise HTTPException(
                status_code=400,
                detail="Username already exists."
            )

        return await UserRepository.create_user(db, user)

    @staticmethod
    async def login(db: AsyncSession, request: LoginRequest):
        existing_user = await UserRepository.get_user_by_email(db, request.email)

        if not existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email doesn't exist, Please Signup."
            )
        
        if not verify_password(request.password, existing_user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Invalid Credentials."
            )

        access_token = create_access_token(existing_user.id)
        refresh_token = create_refresh_token(existing_user.id)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
