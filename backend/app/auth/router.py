from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.users.schemas import UserCreate, UserResponse
from app.auth.service import AuthService

from app.auth.schemas import LoginRequest, Token


router = APIRouter()

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        return AuthService.signup(db, user)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
def login(user: LoginRequest, db: Session = Depends(get_db)):
    try:
        return AuthService.login(db, user)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.auth.dependencies import get_current_user

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user

