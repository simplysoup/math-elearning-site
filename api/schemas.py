from pydantic import BaseModel, EmailStr
from typing import List, Union, Literal

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class MarkdownData(BaseModel):
    text: str
    format: str

class MultipleChoiceQuestionData(BaseModel):
    format: Literal["multiple_choice"]
    question: str
    options: List[str]
    correct_answer: int
    explanation: str
    visualization: bool

class ShortAnswerQuestionData(BaseModel):
    format: Literal["short_answer"]
    question: str
    correct_answer: str
    explanation: str
    visualization: bool

class QuestionContent(BaseModel):
    type: Literal["question"]
    data: Union[MultipleChoiceQuestionData, ShortAnswerQuestionData]

class MarkdownContent(BaseModel):
    type: Literal["markdown"]
    data: MarkdownData

LessonContentOut = Union[QuestionContent, MarkdownContent]
