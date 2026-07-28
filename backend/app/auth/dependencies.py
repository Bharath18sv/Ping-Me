from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from app.auth.jwt import decode_token

from app.db.dependencies import get_db

from app.users.service import get_user_by_id

# The security object is used to extract the token from the request header.
# It is a dependency that will be called by the router.
security = HTTPBearer()

def get_current_user(credentials:HTTPAuthorizationCredentials=Depends(security), db: Session = Depends(get_db)):
    payload = decode_token(credentials.credentials)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token."
        )
    '''
    payload structure : {
        "sub" : user_id,
        "type" : "access"
    }
    '''
    if payload["type"] != "access":
        raise HTTPException(
            status_code=401,
            detail="Invalid Token."
        )
    
    user = get_user_by_id(db, payload["sub"])

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )
    
    return user