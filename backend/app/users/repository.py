from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.db.models.user import User
from app.users.schemas import UserCreate
from app.auth.passwords import hash_password

class UserRepository:

    async def create_user(db: AsyncSession, user: UserCreate):
        try:
            db_user = User(
                name=user.name,
                username=user.username,
                email=user.email,
                password_hash=hash_password(user.password)
            )

            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)
            return db_user
        except IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=400, detail="user already exists")
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    async def get_user_by_email(db: AsyncSession, email: str):
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_username(db: AsyncSession, username: str):
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_user_by_id(db: AsyncSession, id: str):
        result = await db.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()
        
    async def search_users(db: AsyncSession, query: str, current_user_id: str, limit: int = 20):
        print("Searching users...")
        result = await db.execute(
            select(User).where(
                User.id != current_user_id,
                or_(
                    User.name.ilike(f"%{query}%"),
                    User.username.ilike(f"%{query}%")
                )
            )
            .order_by(User.username)
            .limit(limit)
        )
        return result.scalars().all()
