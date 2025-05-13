from pydantic import BaseModel, constr, validator
from typing import List, Union, Literal
import bleach

class SanitizedBaseModel(BaseModel):
    @validator('*', pre=True)
    def sanitize_strings(cls, v, field):
        if field.type_ == str and v is not None:
            return bleach.clean(v, tags=[], strip=True)
        return v

class MarkdownData(SanitizedBaseModel):
    text: constr(min_length=1, max_length=10000)
    format: constr(regex=r'^(plain|markdown)$')

class MultipleChoiceQuestionData(SanitizedBaseModel):
    format: Literal["multiple_choice"]
    question: constr(min_length=5, max_length=500)
    options: List[constr(min_length=1, max_length=200)]
    correct_answer: int
    explanation: constr(max_length=1000) = ""
    visualization: bool = False

    @validator('options')
    def validate_options(cls, v):
        if len(v) < 2:
            raise ValueError("At least 2 options required")
        if len(v) != len(set(v)):
            raise ValueError("Options must be unique")
        return v

    @validator('correct_answer')
    def validate_answer_index(cls, v, values):
        if 'options' in values and v >= len(values['options']):
            raise ValueError("Correct answer index out of range")
        return v

class ShortAnswerQuestionData(SanitizedBaseModel):
    format: Literal["short_answer"]
    question: constr(min_length=5, max_length=500)
    correct_answer: constr(min_length=1, max_length=500)
    explanation: constr(max_length=1000) = ""
    visualization: bool = False

class QuestionContent(SanitizedBaseModel):
    type: Literal["question"]
    data: Union[MultipleChoiceQuestionData, ShortAnswerQuestionData]

class MarkdownContent(SanitizedBaseModel):
    type: Literal["markdown"]
    data: MarkdownData

LessonContentOut = Union[QuestionContent, MarkdownContent]