from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.users.schemas import UserCreate
from app.users.repository import UserRepository

async def create_user(db: AsyncSession, user: UserCreate):
    existing_email = await UserRepository.get_user_by_email(db, user.email)
    if existing_email:
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

async def get_user_by_email(db: AsyncSession, email: str):
    return await UserRepository.get_user_by_email(db, email)

async def get_user_by_username(db: AsyncSession, username: str):
    return await UserRepository.get_user_by_username(db, username)

async def get_user_by_id(db: AsyncSession, id: str):
    user = await UserRepository.get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

async def search_users(db: AsyncSession, query: str, current_user_id: str, limit: int = 20):
    return await UserRepository.search_users(db, query, current_user_id, limit)
