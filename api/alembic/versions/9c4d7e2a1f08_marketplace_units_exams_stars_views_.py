"""Marketplace: units rename, course ownership/publishing, exams, stars, views, comments

Revision ID: 9c4d7e2a1f08
Revises: 7c2e9a41b5d8
Create Date: 2026-11-06

- Rename chapters -> units and lessons.chapter_id -> unit_id.
- Add Course owner_id / visibility / level / estimated_time_minutes /
  prerequisites. The existing live course (id 1, Foundational Algebra)
  becomes published and owned by the lowest user id, if any user exists.
- New tables: course_views, stars, exams, exam_questions,
  exam_question_options, exam_attempts, comments.
- At most one exam per unit (unique on exams.unit_id; NULLs are not
  duplicates in either dialect) and at most one final exam per course
  (partial unique index on exams.course_id WHERE is_final).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c4d7e2a1f08'
down_revision: Union[str, None] = '7c2e9a41b5d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename chapters -> units. Both SQLite (>= 3.25) and Postgres
    # update foreign-key references to the renamed table.
    op.rename_table('chapters', 'units')
    # Rename lessons.chapter_id -> lessons.unit_id.
    op.alter_column('lessons', 'chapter_id', new_column_name='unit_id')

    # Course ownership / publishing / card fields. Batch mode: SQLite
    # cannot ADD a foreign-key constraint with a plain ALTER TABLE.
    op.add_column('courses', sa.Column('owner_id', sa.Integer(), nullable=True))
    op.add_column('courses', sa.Column('visibility', sa.String(length=20), server_default='private', nullable=False))
    op.add_column('courses', sa.Column('level', sa.String(length=100), nullable=True))
    op.add_column('courses', sa.Column('estimated_time_minutes', sa.Integer(), nullable=True))
    op.add_column('courses', sa.Column('prerequisites', sa.Text(), nullable=True))
    with op.batch_alter_table('courses') as batch_op:
        batch_op.create_foreign_key('fk_courses_owner_id_users', 'users', ['owner_id'], ['id'], ondelete='SET NULL')

    # The live course becomes published, owned by the lowest user id
    # if any user exists (the subquery is NULL otherwise, leaving the
    # owner NULL).
    op.execute("UPDATE courses SET visibility = 'published' WHERE id = 1")
    op.execute("UPDATE courses SET owner_id = (SELECT MIN(id) FROM users) WHERE id = 1")

    op.create_table('course_views',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('viewed_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('stars',
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('course_id', 'user_id', name='pk_stars')
    )
    op.create_table('exams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=True),
        sa.Column('is_final', sa.Boolean(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('pass_mark', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('unit_id', name='uq_exam_unit_id')
    )
    # One final exam per course (partial unique index; both dialects
    # support WHERE on a boolean column).
    op.execute("CREATE UNIQUE INDEX uq_exam_final_per_course ON exams (course_id) WHERE is_final")
    op.create_table('exam_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        # Reuse the questionformatenum type the baseline migration
        # already created for the questions table; creating it again
        # fails on Postgres ("type already exists").
        sa.Column('format', sa.Enum('multiple_choice', 'short_answer', name='questionformatenum', create_type=False), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('exam_question_options',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('option_text', sa.Text(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['exam_questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('exam_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('passed', sa.Boolean(), nullable=False),
        sa.Column('attempted_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=True),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('comments')
    op.drop_table('exam_attempts')
    op.drop_table('exam_question_options')
    op.drop_table('exam_questions')
    op.execute("DROP INDEX uq_exam_final_per_course")
    op.drop_table('exams')
    op.drop_table('stars')
    op.drop_table('course_views')
    with op.batch_alter_table('courses') as batch_op:
        batch_op.drop_constraint('fk_courses_owner_id_users', type_='foreignkey')
    op.drop_column('courses', 'prerequisites')
    op.drop_column('courses', 'estimated_time_minutes')
    op.drop_column('courses', 'level')
    op.drop_column('courses', 'visibility')
    op.drop_column('courses', 'owner_id')
    op.alter_column('lessons', 'unit_id', new_column_name='chapter_id')
    op.rename_table('units', 'chapters')
