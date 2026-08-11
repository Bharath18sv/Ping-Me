from redis.asyncio import Redis

class SocketRepository:

    ONLINE_USERS_KEY = "online_users"

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

        await self.redis.sadd(
            self.ONLINE_USERS_KEY,
            user_id
        ) 
    
    async def remove_socket(
        self,
        user_id:str,
        sid:str
    ):
        key = f"socket:user:{user_id}"
        await self.redis.srem(
            key,
            sid
        )

        # only mark user offline if they have no remaining sockets
        socket_count = await self.redis.scard(key)

        if socket_count == 0:
            await self.redis.srem(
                self.ONLINE_USERS_KEY,
                user_id
            )

    async def get_sockets(
        self,
        user_id:str
    ):
        return await self.redis.smembers(
            f"socket:user:{user_id}"
        )
    
    async def socket_count(
        self,
        user_id:str
    ) -> int:
        return await self.redis.scard(f"socket:user:{user_id}")
    
    async def get_online_users(self):
        users = await self.redis.smembers(
            self.ONLINE_USERS_KEY
        )

        return [
            user.decode() if isinstance(user, bytes) else user
            for user in users
        ]


