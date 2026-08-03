"""add soft delete to messages

Revision ID: 866dc447a437
Revises: 2d0a353b9960
Create Date: 2026-08-04 00:14:13.015209

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '866dc447a437'
down_revision: Union[str, Sequence[str], None] = '2d0a353b9960'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "messages",
        sa.Column(
            "is_deleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.add_column(
        "messages",
        sa.Column(
            "deleted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("messages", "deleted_at")
    op.drop_column("messages", "is_deleted")
