import uuid

from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    username: str
    email: str

class UserCreate(UserBase):
    password: str

# example response
# {
#     "id":"uuid",
#     "name":"Bharath",
#     "username":"bharath",
#     "email":"bharath@gmail.com"
# }
class UserResponse(UserBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

# used for GET /users/search
class UserPublic(BaseModel):
    id: uuid.UUID
    name: str
    username: str

# used for user search more
class UserPublic(BaseModel):
    id: uuid.UUID
    name:str
    username: str

    class Config:
        from_attributes = True

