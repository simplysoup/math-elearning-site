from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, Boolean,
    Enum, DateTime, JSON, func, PrimaryKeyConstraint, ForeignKey, UniqueConstraint,
    Index,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, declarative_base
import enum

Base = declarative_base()

# --- Enums ---
class ContentTypeEnum(str, enum.Enum):
    markdown = "markdown"
    question = "question"
    video = "video"
    visualization = "visualization"

class QuestionFormatEnum(str, enum.Enum):
    multiple_choice = "multiple_choice"
    short_answer = "short_answer"

# --- Models ---

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    email_verified = Column(Boolean, default=False)
    phone = Column(String(20), unique=True, nullable=True)
    phone_verified = Column(Boolean, default=False)
    password_hash = Column(String(255), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

class AuthProvider(enum.Enum):
    EMAIL = 'email'
    GOOGLE = 'google'
    GITHUB = 'github'
    APPLE = 'apple'
    MICROSOFT = 'microsoft'

class UserAuthProvider(Base):
    __tablename__ = 'user_auth_providers'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    provider = Column(Enum(AuthProvider, name='auth_provider'), nullable=False)
    provider_id = Column(String(255), nullable=False)
    provider_email = Column(String(255), nullable=True)
    provider_data = Column(JSON, nullable=True)  # Automatically maps to JSONB in PostgreSQL
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('provider', 'provider_id', name='uq_provider_provider_id'),
    )

class Course(Base):
    __tablename__ = 'courses'

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    # Marketplace ownership: the account that created the course. This
    # is the owner; created_by is kept for backwards compatibility and
    # is set to the same user for new courses.
    owner_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    visibility = Column(String(20), nullable=False, server_default='private', default='private')
    level = Column(String(100), nullable=True)
    estimated_time_minutes = Column(Integer, nullable=True)
    prerequisites = Column(Text, nullable=True)

    owner = relationship("User", foreign_keys=[owner_id])
    tags = relationship("CourseTag", back_populates="course")
    units = relationship("Unit", back_populates="course")
    lessons = relationship("Lesson", back_populates="course")

class CourseCreator(Base):
    __tablename__ = 'course_creators'

    course_id = Column(Integer, ForeignKey('courses.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    can_edit = Column(Boolean, default=True)
    can_publish = Column(Boolean, default=False)
    can_manage_users = Column(Boolean, default=False)
    assigned_at = Column(DateTime, server_default=func.now())
    assigned_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    course = relationship("Course", backref="creators")
    user = relationship("User", foreign_keys=[user_id], backref="course_roles")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by], backref="assigned_course_roles")

    __table_args__ = (
        PrimaryKeyConstraint('course_id', 'user_id', name='pk_course_creators'),
    )

class CourseStudent(Base):
    __tablename__ = 'course_students'

    course_id = Column(Integer, ForeignKey('courses.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    enrolled_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    progress = Column(Integer, default=0)  # Assumes 0–100 range
    last_accessed = Column(DateTime, nullable=True)

    course = relationship("Course", backref="students")
    user = relationship("User", backref="enrollments")

    __table_args__ = (
        PrimaryKeyConstraint('course_id', 'user_id', name='pk_course_students'),
    )

class UserLessonProgress(Base):
    """One row per completed lesson per user.

    Progress is derived from these rows (completed lessons / total
    lessons in the course); CourseStudent.progress is a cached copy of
    that percentage, updated when a lesson is completed.
    """

    __tablename__ = 'user_lesson_progress'

    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    lesson_id = Column(Integer, ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False)
    completed_at = Column(DateTime, server_default=func.now())

    user = relationship("User", backref="lesson_progress")
    lesson = relationship("Lesson", backref="completions")

    __table_args__ = (
        PrimaryKeyConstraint('user_id', 'lesson_id', name='pk_user_lesson_progress'),
    )


class SystemAdmin(Base):
    __tablename__ = 'system_admins'

    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    assigned_at = Column(DateTime, server_default=func.now())
    assigned_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    user = relationship("User", foreign_keys=[user_id], backref="admin_role")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by], backref="admins_assigned")

class Tag(Base):
    __tablename__ = 'tags'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    course_tags = relationship("CourseTag", back_populates="tag")


class CourseTag(Base):
    __tablename__ = "course_tags"

    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    course = relationship("Course", back_populates="tags")
    tag = relationship("Tag", back_populates="course_tags")


class Unit(Base):
    """A gated block of lessons. Formerly Chapter (renamed, same table
    content under the new name `units`)."""

    __tablename__ = "units"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    image_url = Column(String(255))
    sort_order = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    course = relationship("Course", back_populates="units")
    lessons = relationship("Lesson", back_populates="unit")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="CASCADE"))
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    sort_order = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    unit = relationship("Unit", back_populates="lessons")
    course = relationship("Course", back_populates="lessons")
    contents = relationship("LessonContent", back_populates="lesson")


class LessonContent(Base):
    __tablename__ = "lesson_contents"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"))
    content_type = Column(Enum(ContentTypeEnum), nullable=False)
    sort_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    lesson = relationship("Lesson", back_populates="contents")
    markdown = relationship("MarkdownContent", back_populates="content", uselist=False)
    question = relationship("Question", back_populates="content", uselist=False)
    visualization = relationship("VisualizationContent", back_populates="content", uselist=False)
    video = relationship("VideoContent", back_populates="content", uselist=False)


class MarkdownContent(Base):
    __tablename__ = "markdown_contents"

    content_id = Column(Integer, ForeignKey("lesson_contents.id", ondelete="CASCADE"), primary_key=True)
    text = Column(Text, nullable=False)
    format = Column(String(20), nullable=False)

    content = relationship("LessonContent", back_populates="markdown")


class VideoContent(Base):
    """An embedded video block: a YouTube or Vimeo link.

    Only the source URL and an optional caption are stored. The
    frontend builds the embed URL from the parsed video ID, so an
    arbitrary URL can never become an iframe src.
    """

    __tablename__ = "video_contents"

    content_id = Column(Integer, ForeignKey("lesson_contents.id", ondelete="CASCADE"), primary_key=True)
    url = Column(Text, nullable=False)
    caption = Column(Text, nullable=True)

    content = relationship("LessonContent", back_populates="video")


class VisualizationContent(Base):
    """An interactive visualization block.

    ``config`` is a JSON document describing the visualization, e.g.
    {"kind": "linear-combine", "a": 3, "b": 2, "x": 4, ...}. The
    frontend renders it; the API only stores and serves the config,
    so new visualization kinds need no backend change.
    """

    __tablename__ = "visualization_contents"

    content_id = Column(Integer, ForeignKey("lesson_contents.id", ondelete="CASCADE"), primary_key=True)
    engine = Column(String(20), nullable=False, default="custom")
    config = Column(JSON, nullable=False, default=dict)

    content = relationship("LessonContent", back_populates="visualization")


class Question(Base):
    __tablename__ = "questions"

    content_id = Column(Integer, ForeignKey("lesson_contents.id", ondelete="CASCADE"), primary_key=True)
    question_format = Column(Enum(QuestionFormatEnum), nullable=False)
    question_text = Column(Text, nullable=False)
    explanation = Column(Text)
    visualization = Column(Boolean, default=False)

    content = relationship("LessonContent", back_populates="question")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    short_answer = relationship("ShortAnswerQuestion", back_populates="question", uselist=False, cascade="all, delete-orphan")


class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.content_id", ondelete="CASCADE"))
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    sort_order = Column(Integer)

    question = relationship("Question", back_populates="options")


class ShortAnswerQuestion(Base):
    __tablename__ = "short_answer_questions"

    question_id = Column(Integer, ForeignKey("questions.content_id", ondelete="CASCADE"), primary_key=True)
    correct_answer = Column(Text, nullable=False)

    question = relationship("Question", back_populates="short_answer")


# --- Marketplace tables ---

class CourseView(Base):
    """One row per course page load. The owner's own views are never
    recorded (see POST /courses/{id}/view)."""

    __tablename__ = "course_views"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    viewed_at = Column(DateTime, server_default=func.now())

    course = relationship("Course", backref="views")
    user = relationship("User", backref="course_views")


class Star(Base):
    """One star per person per course. The (course_id, user_id) primary
    key enforces uniqueness at the DB level."""

    __tablename__ = "stars"

    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    course = relationship("Course", backref="stars")
    user = relationship("User", backref="stars")

    __table_args__ = (
        PrimaryKeyConstraint('course_id', 'user_id', name='pk_stars'),
    )


class Exam(Base):
    """A unit exam (unit_id set, is_final False) or a course final exam
    (unit_id NULL, is_final True). At most one exam per unit (unique on
    unit_id, NULLs excluded by both dialects) and at most one final
    exam per course (partial unique index below)."""

    __tablename__ = "exams"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="CASCADE"), nullable=True)
    is_final = Column(Boolean, nullable=False, default=False)
    title = Column(String(255), nullable=False)
    pass_mark = Column(Integer, nullable=False, default=70)
    created_at = Column(DateTime, server_default=func.now())

    course = relationship("Course", backref="exams")
    unit = relationship("Unit", backref="exams")
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    attempts = relationship("ExamAttempt", back_populates="exam", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('unit_id', name='uq_exam_unit_id'),
        Index(
            'uq_exam_final_per_course', 'course_id', unique=True,
            sqlite_where=(is_final == True),  # noqa: E712
            postgresql_where=(is_final == True),  # noqa: E712
        ),
    )


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    format = Column(Enum(QuestionFormatEnum), nullable=False)
    question_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=True)

    exam = relationship("Exam", back_populates="questions")
    options = relationship("ExamQuestionOption", back_populates="question", cascade="all, delete-orphan")


class ExamQuestionOption(Base):
    """Multiple-choice options (one is_correct per question), or the
    single correct answer string for a short-answer question (stored
    as one option row with is_correct True)."""

    __tablename__ = "exam_question_options"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("exam_questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=True)

    question = relationship("ExamQuestion", back_populates="options")


class ExamAttempt(Base):
    """One row per attempt; retakes are unlimited, latest decides."""

    __tablename__ = "exam_attempts"

    id = Column(Integer, primary_key=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False, default=0)  # 0-100
    passed = Column(Boolean, nullable=False, default=False)
    attempted_at = Column(DateTime, server_default=func.now())

    exam = relationship("Exam", back_populates="attempts")
    user = relationship("User", backref="exam_attempts")


class Comment(Base):
    """A course comment has lesson_id NULL; a lesson comment has both
    course_id and lesson_id set."""

    __tablename__ = "comments"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    course = relationship("Course", backref="comments")
    lesson = relationship("Lesson", backref="comments")
    author = relationship("User", backref="comments")
