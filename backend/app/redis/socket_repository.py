from redis.asyncio import Redis

class SocketRepository:

    def __init__(self, redis:Redis):
        self.redis = redis
    
    async def add_socket(
        self,
        user_id:str,
        sid:str
    ):
        await self.redis.sadd(
            f"socket:user:{user_id}",
            sid
        )
    
    async def remove_socket(
        self,
        user_id:str,
        sid:str
    ):
        await self.redis.srem(
            f"socket:user:{user_id}",
            sid
        )

    async def get_sockets(
        self,
        user_id:str
    ):
        return await self.redis.smembers(
            f"socket:user:{user_id}"
        )

