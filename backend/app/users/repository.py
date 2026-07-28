from sqlalchemy.orm import Session
from sqlalchemy import or_

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.db.models.user import User
from app.users.schemas import UserCreate
from app.auth.passwords import hash_password

class UserRepository:

    @staticmethod
    def create_user(db: Session, user: UserCreate):
        try:
            db_user = User(
                name=user.name,
                username=user.username,
                email=user.email,
                password_hash=hash_password(user.password)
            )

            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="user already exists")
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first() 

    @staticmethod
    def get_user_by_username(db: Session, username: str):
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_id(db: Session, id: str):
        return db.query(User).filter(User.id == id).first()

    @staticmethod
    def search_users(db: Session, query: str, current_user_id: str, limit: int = 20):
        print("Searching users...")
        return (
            db.query(User).filter(
                User.id != current_user_id,
                or_(
                    User.name.ilike(f"%{query}%"),
                    User.username.ilike(f"%{query}%")
                )
            )
            .order_by(User.username)
            .limit(limit)
            .all()
        )

