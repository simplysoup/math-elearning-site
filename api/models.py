from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, Boolean,
    Enum, TIMESTAMP, func
)
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

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    image_url = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    tags = relationship("CourseTag", back_populates="course")
    chapters = relationship("Chapter", back_populates="course")
    lessons = relationship("Lesson", back_populates="course")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)

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
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

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
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    chapter = relationship("Chapter", back_populates="lessons")
    course = relationship("Course", back_populates="lessons")
    contents = relationship("LessonContent", back_populates="lesson")


class LessonContent(Base):
    __tablename__ = "lesson_contents"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"))
    content_type = Column(Enum(ContentTypeEnum), nullable=False)
    sort_order = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

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
