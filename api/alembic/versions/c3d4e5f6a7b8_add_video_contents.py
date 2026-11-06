"""Add video_contents for embedded YouTube/Vimeo lesson blocks.

Revision ID: c3d4e5f6a7b8
Revises: 9c4d7e2a1f08
Create Date: 2026-11-06
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = '9c4d7e2a1f08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('video_contents',
    sa.Column('content_id', sa.Integer(), nullable=False),
    sa.Column('url', sa.Text(), nullable=False),
    sa.Column('caption', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['content_id'], ['lesson_contents.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('content_id')
    )


def downgrade() -> None:
    op.drop_table('video_contents')
