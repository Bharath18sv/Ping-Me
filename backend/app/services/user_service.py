from sqlalchemy.orm import Session
from sqlalchemy import or_

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password

def create_user(db:Session, user:UserCreate):
    try:
        db_user = User(
            name=user.name,
            username=user.username,
            email=user.email,
            password_hash=hash_password(user.password)
        )

        db.add(db_user)

        db.commit()

        # load record again to get generated values like id, created_at, updated_at
        db.refresh(db_user)

        return db_user

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="user already exists")

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def get_user_by_email(db:Session, email:str):
    return db.query(User).filter(User.email == email).first()    

def get_user_by_username(db:Session, username:str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_id(db:Session, id:str):
    return (
        db.query(User)
        .filter(User.id == id)
        .first()
    )

# we are passing current user id, because we don't want to search themself
def search_users(db:Session, query:str, current_user_id:str, limit:int = 20):
    print("Searching users...")
    # don't use a newline after return keyword
    return (
        db.query(User).filter(
            User.id != current_user_id, #don't return the same person details
            or_(
                User.name.ilike(f"%{query}%"), #search for name
                User.username.ilike(f"%{query}%") #search for username
                )
            )
            .order_by(User.username) #sort the users based on username
            .limit(limit)
            .all()
    )

