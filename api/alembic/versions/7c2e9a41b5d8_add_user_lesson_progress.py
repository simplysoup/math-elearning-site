"""Add user_lesson_progress table

Revision ID: 7c2e9a41b5d8
Revises: 559d8fb902ef
Create Date: 2026-11-05

Additive only: one new table for per-lesson completion. No existing
table is touched, so the seeded course and any users survive the
upgrade.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c2e9a41b5d8'
down_revision: Union[str, None] = '559d8fb902ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('user_lesson_progress',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('lesson_id', sa.Integer(), nullable=False),
    sa.Column('completed_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', 'lesson_id', name='pk_user_lesson_progress')
    )


def downgrade() -> None:
    op.drop_table('user_lesson_progress')
