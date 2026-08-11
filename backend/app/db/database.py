from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

raw_url = (settings.DATABASE_URL or "").strip().strip('"\'')

if not raw_url or raw_url.startswith("${{"):
    raise RuntimeError(
        "Invalid DATABASE_URL. Please select + New Variable -> Add Reference in Railway to link your Postgres DATABASE_URL or paste your Postgres connection string."
    )

if raw_url.startswith("postgres://"):
    ASYNC_DATABASE_URL = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql://"):
    ASYNC_DATABASE_URL = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    ASYNC_DATABASE_URL = raw_url

engine = create_async_engine(ASYNC_DATABASE_URL)

AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()