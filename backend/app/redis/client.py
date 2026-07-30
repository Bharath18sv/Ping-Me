from redis.asyncio import Redis
from app.core.config import settings

redis_client = Redis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    # instead of b"hello" we get "hello" when we decode response
    decode_responses=True
)

async def check_redis_connection():
    await redis_client.ping()