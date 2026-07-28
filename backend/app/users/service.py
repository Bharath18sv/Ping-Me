from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.users.schemas import UserCreate
from app.users.repository import UserRepository

def create_user(db: Session, user: UserCreate):
    existing_email = UserRepository.get_user_by_email(db, user.email)
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists."
        )

    existing_username = UserRepository.get_user_by_username(db, user.username)
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists."
        )

    return UserRepository.create_user(db, user)

def get_user_by_email(db: Session, email: str):
    return UserRepository.get_user_by_email(db, email)

def get_user_by_username(db: Session, username: str):
    return UserRepository.get_user_by_username(db, username)

def get_user_by_id(db: Session, id: str):
    user = UserRepository.get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

def search_users(db: Session, query: str, current_user_id: str, limit: int = 20):
    return UserRepository.search_users(db, query, current_user_id, limit)

