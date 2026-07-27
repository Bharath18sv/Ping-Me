from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.users import router as user_router
from app.api.conversations import router as conversation_router

app = FastAPI()

app.include_router(auth_router, prefix='/auth', tags=["Authentication"])
app.include_router(user_router, prefix='/users', tags=["Users"])
app.include_router(conversation_router, prefix="/conversations", tags=["Conversations"])

@app.get("/")
def root():
    return {
        "message" : "Welcome to ping-me"
    }        