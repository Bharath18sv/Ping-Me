from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.auth.dependencies import get_current_user
from app.db.models.user import User
from app.users.schemas import UserPublic
from app.users.service import search_users

router = APIRouter()

@router.get("/search", response_model=list[UserPublic])
def search(
    q: str = Query(..., min_length=2, description="Search query"), #min 2 character should be there to search
    db:Session = Depends(get_db),
    current_user:User = Depends(get_current_user)):
    print("Calling search function in controller")
    return search_users(db, q, current_user_id=current_user.id)



