from passlib.context import CryptContext

# this tells passlib use bcrypt for hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

# helper to hash the password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# helper to verify the password
def verify_password(plain_passw:str, hashed_passw:str) -> bool:
    return pwd_context.verify(plain_passw, hashed_passw)
