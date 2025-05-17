from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, Boolean,
    Enum, DateTime, JSON, func, PrimaryKeyConstraint, ForeignKey, UniqueConstraint
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

    tags = relationship("CourseTag", back_populates="course")
    chapters = relationship("Chapter", back_populates="course")
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


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    image_url = Column(String(255))
    sort_order = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    course = relationship("Course", back_populates="chapters")
    lessons = relationship("Lesson", back_populates="chapter")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"))
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    sort_order = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    chapter = relationship("Chapter", back_populates="lessons")
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


class MarkdownContent(Base):
    __tablename__ = "markdown_contents"

    content_id = Column(Integer, ForeignKey("lesson_contents.id", ondelete="CASCADE"), primary_key=True)
    text = Column(Text, nullable=False)
    format = Column(String(20), nullable=False)

    content = relationship("LessonContent", back_populates="markdown")


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
