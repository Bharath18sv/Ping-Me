import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(String)

    username: Mapped[str] = mapped_column(
        String,
        unique=True
    )

    email: Mapped[str] = mapped_column(
        String,
        unique=True
    )

    password_hash: Mapped[str] = mapped_column(String)