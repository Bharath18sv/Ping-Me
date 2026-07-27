from fastapi import FastAPI
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.conversations.router import router as conversations_router
from app.messages.router import router as messages_router

app = FastAPI()

app.include_router(auth_router, prefix='/auth', tags=["Authentication"])
app.include_router(user_router, prefix='/users', tags=["Users"])
app.include_router(conversation_router, prefix="/conversations", tags=["Conversations"])

@app.get("/")
def root():
    return {
        "message" : "Welcome to ping-me"
    }        