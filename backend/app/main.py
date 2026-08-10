from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.conversations.router import router as conversations_router
from app.messages.router import router as messages_router
from app.storage.router import router as storage_router

from contextlib import asynccontextmanager

from app.redis.client import redis_client, check_redis_connection

import logging
from app.core.logging import setup_logging

from app.sockets.server import socket_app
from app.core.config import settings

setup_logging()

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("LIFESPAN START")

    logger.info("🚀 Starting the application")
    await check_redis_connection()
    logger.info("✅ Redis connected")

    yield

    print("LIFESPAN END")

    await redis_client.close()
    logger.info("⛔ Redis disconnected")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount socket.io app
app.mount("/socket.io", socket_app)

app.include_router(auth_router, prefix='/auth', tags=["Authentication"])
app.include_router(users_router, prefix='/users', tags=["Users"])
app.include_router(conversations_router, prefix="/conversations", tags=["Conversations"])
app.include_router(messages_router, tags=["Messages"])
app.include_router(storage_router, tags=["Storage"],)

@app.get("/")
def root():
    return {
        "message" : "Welcome to ping-me"
    }        