from pydantic import BaseModel, EmailStr
from typing import List, Union, Literal
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class CourseCreate(BaseModel):
    title: str
    description: str | None = None
    level: str | None = None
    estimated_time_minutes: int | None = None
    prerequisites: str | None = None


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    bio: str | None = None
    username: str | None = None


class ExamQuestionIn(BaseModel):
    format: Literal["multiple_choice", "short_answer"]
    question: str
    options: List[str] | None = None
    # Option index for multiple_choice, answer string for short_answer.
    correct_answer: int | str
    explanation: str | None = None


class ExamCreate(BaseModel):
    title: str | None = None
    pass_mark: int = 70
    questions: List[ExamQuestionIn] = []


class ExamAnswerIn(BaseModel):
    question_id: int
    # Option index for multiple_choice, answer string for short_answer.
    answer: int | str


class ExamAttemptIn(BaseModel):
    answers: List[ExamAnswerIn] = []


class CommentIn(BaseModel):
    text: str


# --- Editor input blocks (PUT /lessons/{id}/content/) ---
# These mirror the frontend editor's ContentBlock shapes, not the
# read-side LessonContentOut shapes: the editor calls a question
# block "multiple_choice"/"short_answer" directly, and a code block
# is stored as a fenced markdown block (there is no code content type).

class EditorMarkdownData(BaseModel):
    text: str


class EditorMarkdownBlock(BaseModel):
    type: Literal["markdown"]
    data: EditorMarkdownData


class EditorMultipleChoiceData(BaseModel):
    question: str
    options: List[str]
    correctAnswer: int
    explanation: str | None = None


class EditorMultipleChoiceBlock(BaseModel):
    type: Literal["multiple_choice"]
    data: EditorMultipleChoiceData


class EditorShortAnswerData(BaseModel):
    question: str
    answer: str
    explanation: str | None = None


class EditorShortAnswerBlock(BaseModel):
    type: Literal["short_answer"]
    data: EditorShortAnswerData


class EditorCodeData(BaseModel):
    code: str
    language: str = "python"


class EditorCodeBlock(BaseModel):
    type: Literal["code"]
    data: EditorCodeData


class EditorVisualizationData(BaseModel):
    engine: str = "custom"
    config: dict


class EditorVisualizationBlock(BaseModel):
    # Read-only in the editor: the block is kept as-is so a lesson's
    # interactive visualization survives a content save.
    type: Literal["visualization"]
    data: EditorVisualizationData


EditorBlockIn = Union[
    EditorMarkdownBlock,
    EditorMultipleChoiceBlock,
    EditorShortAnswerBlock,
    EditorCodeBlock,
    EditorVisualizationBlock,
]


class EnrolledCourseOut(BaseModel):
    course_id: int
    title: str
    description: str | None = None
    image_url: str | None = None
    progress: int
    total_lessons: int
    completed_lessons: int
    enrolled_at: datetime | None = None
    last_accessed: datetime | None = None


class MarkdownData(BaseModel):
    text: str
    format: str

class MultipleChoiceQuestionData(BaseModel):
    format: Literal["multiple_choice"]
    question: str
    options: List[str]
    correct_answer: int
    explanation: str | None = None
    visualization: bool

class ShortAnswerQuestionData(BaseModel):
    format: Literal["short_answer"]
    question: str
    correct_answer: str
    explanation: str | None = None
    visualization: bool

class QuestionContent(BaseModel):
    type: Literal["question"]
    data: Union[MultipleChoiceQuestionData, ShortAnswerQuestionData]

class MarkdownContent(BaseModel):
    type: Literal["markdown"]
    data: MarkdownData


class VisualizationData(BaseModel):
    engine: str
    config: dict


class VisualizationContent(BaseModel):
    type: Literal["visualization"]
    data: VisualizationData


LessonContentOut = Union[QuestionContent, MarkdownContent, VisualizationContent]
