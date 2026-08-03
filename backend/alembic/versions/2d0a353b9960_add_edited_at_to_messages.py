"""add edited_at to messages

Revision ID: 2d0a353b9960
Revises: 6fa60a9ae1fa
Create Date: 2026-08-03 23:43:21.327982

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d0a353b9960'
down_revision: Union[str, Sequence[str], None] = '6fa60a9ae1fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "messages",
        sa.Column("edited_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""    
    op.drop_column("messages", "edited_at")
