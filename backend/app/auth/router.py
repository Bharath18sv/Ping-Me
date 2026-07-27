from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import create_user, get_user_by_email, get_user_by_username

from app.schemas.auth import LoginRequest, Token
from app.core.security import create_access_token, create_refresh_token, verify_password

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
def signup(user:UserCreate, db:Session=Depends(get_db)):
    try:
        # check if the user already exist
        existing_user = get_user_by_email(db, user.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists."
            )
        # check username exists
        existing_username = get_user_by_username(db, user.username)

        if existing_username:
            raise HTTPException(
                status_code=400,
                detail="Username already exists."
            )

        # creating the user
        user = create_user(db, user)

        return user
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
def login(user:LoginRequest, db:Session=Depends(get_db)):
    try:
        existing_user = get_user_by_email(db, user.email)
        # print(existing_user.id)
        # print(existing_user.email)
        # print(existing_user.password_hash)

        if existing_user is None:
            raise HTTPException(
                status_code=400,
                detail="Email doesn't exist, Please Signup."
            )
        
        if not verify_password(user.password, existing_user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Invalid Credentials."
            )

        access_token = create_access_token(existing_user.id)
        refresh_token = create_refresh_token(existing_user.id)
        # print(access_token, refresh_token)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.auth.dependencies import get_current_user

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user

