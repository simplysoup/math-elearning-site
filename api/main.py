import os
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from database import engine, get_db
from models import (
    Base, Course, Chapter, Lesson, LessonContent, MarkdownContent,
    Question, QuestionOption, ShortAnswerQuestion, User,
    VisualizationContent, CourseStudent, UserLessonProgress,
)
from schemas import (
    LessonContentOut, UserCreate, UserLogin, RefreshRequest,
    EditorBlockIn, EnrolledCourseOut,
)
from auth import (
    register_user, login_user, get_current_user, refresh_access_token,
    create_access_token, create_refresh_token,
)
from utils import verify_email_token
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware


# Tables are created by Alembic migrations (api/alembic), run on startup
# by the entrypoint; see api/entrypoint.sh. Do not create_all here:
# it would silently diverge from the migration history.
app = FastAPI()

# --- CORS ---
# In production the frontend is served by nginx and calls the API through
# the same-origin /api proxy, so no CORS origin is needed. Direct browser
# calls (local dev, a separately hosted frontend) need their origin here,
# set via CORS_ORIGINS (comma-separated). Defaults cover local dev only.
_cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _public_user(user: User) -> dict:
    """The user object the frontend stores: never a password hash."""
    return {"id": user.id, "email": user.email, "username": user.username}


def _tokens_for(user: User) -> dict:
    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


def _serialize_lesson_content(db: Session, lesson_id: int) -> list:
    """Lesson content in read order, in the GET response shape."""
    contents = (
        db.query(LessonContent)
        .filter(LessonContent.lesson_id == lesson_id)
        .order_by(LessonContent.sort_order)
        .all()
    )
    output = []
    for content in contents:
        if content.content_type == 'markdown':
            markdown = db.query(MarkdownContent).filter(MarkdownContent.content_id == content.id).first()
            if not markdown:
                continue
            output.append({
                "type": "markdown",
                "data": {"text": markdown.text, "format": markdown.format},
            })
        elif content.content_type == 'visualization':
            viz = db.query(VisualizationContent).filter(VisualizationContent.content_id == content.id).first()
            if not viz:
                continue
            output.append({
                "type": "visualization",
                "data": {"engine": viz.engine, "config": viz.config},
            })
        elif content.content_type == 'question':
            question = db.query(Question).filter(Question.content_id == content.id).first()
            if not question:
                continue
            options = db.query(QuestionOption).filter(QuestionOption.question_id == question.content_id).order_by(QuestionOption.sort_order).all()
            short_answer = db.query(ShortAnswerQuestion).filter(ShortAnswerQuestion.question_id == question.content_id).first()

            if question.question_format == 'multiple_choice':
                output.append({
                    "type": "question",
                    "data": {
                        "format": "multiple_choice",
                        "question": question.question_text,
                        "options": [opt.option_text for opt in options],
                        "correct_answer": next((i for i, opt in enumerate(options) if opt.is_correct), None),
                        "explanation": question.explanation,
                        "visualization": question.visualization,
                    },
                })
            elif question.question_format == 'short_answer':
                output.append({
                    "type": "question",
                    "data": {
                        "format": "short_answer",
                        "question": question.question_text,
                        "correct_answer": short_answer.correct_answer if short_answer else "",
                        "explanation": question.explanation,
                        "visualization": question.visualization,
                    },
                })
    return output


def _course_progress(db: Session, user_id: int, course_id: int) -> tuple[int, int, int]:
    """(completed_lessons, total_lessons, progress_percent) for a user."""
    total = db.query(Lesson).filter(Lesson.course_id == course_id).count()
    completed = (
        db.query(UserLessonProgress)
        .join(Lesson, UserLessonProgress.lesson_id == Lesson.id)
        .filter(
            UserLessonProgress.user_id == user_id,
            Lesson.course_id == course_id,
        )
        .count()
    )
    progress = round(100 * completed / total) if total else 0
    return completed, total, progress


def _ensure_enrollment(db: Session, user_id: int, course_id: int) -> CourseStudent:
    enrollment = (
        db.query(CourseStudent)
        .filter(
            CourseStudent.course_id == course_id,
            CourseStudent.user_id == user_id,
        )
        .first()
    )
    if not enrollment:
        enrollment = CourseStudent(course_id=course_id, user_id=user_id, progress=0)
        db.add(enrollment)
        db.flush()
    return enrollment


# --- Auth Endpoints ---

@app.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = register_user(user_data, db)
    # Auto-login: the frontend stores the tokens and the public user.
    return {**_public_user(user), **_tokens_for(user)}

@app.get("/user")
def get_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "bio": current_user.bio,
        "avatar_url": current_user.avatar_url,
    }

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(user.email, user.password, db)

@app.post("/refresh")
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    return refresh_access_token(body.refresh_token, db)

@app.post("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    email = verify_email_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.email_verified = True
    db.commit()
    return {"message": "Email verified successfully"}

# --- Courses Endpoints ---
@app.post("/courses/")
def create_course(
    title: str,
    description: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = Course(title=title, description=description, created_by=current_user.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@app.get("/courses/")
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    # The list endpoint never included chapters, so the landing page used
    # to show "0 chapters · 0 lessons" for every course. Return the real
    # counts instead of the nested rows.
    return [
        {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "image_url": course.image_url,
            "created_at": course.created_at,
            "updated_at": course.updated_at,
            "created_by": course.created_by,
            "chapter_count": len(course.chapters),
            "lesson_count": sum(len(ch.lessons) for ch in course.chapters),
        }
        for course in courses
    ]

@app.get("/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@app.post("/courses/{course_id}/enroll")
def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    enrollment = _ensure_enrollment(db, current_user.id, course_id)
    db.commit()
    db.refresh(enrollment)
    return {
        "course_id": enrollment.course_id,
        "user_id": enrollment.user_id,
        "enrolled_at": enrollment.enrolled_at,
        "progress": enrollment.progress,
    }

@app.get("/me/courses", response_model=list[EnrolledCourseOut])
def get_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollments = (
        db.query(CourseStudent)
        .filter(CourseStudent.user_id == current_user.id)
        .order_by(CourseStudent.enrolled_at.desc())
        .all()
    )
    out = []
    for enrollment in enrollments:
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        if not course:
            continue
        completed, total, progress = _course_progress(db, current_user.id, course.id)
        out.append({
            "course_id": course.id,
            "title": course.title,
            "description": course.description,
            "image_url": course.image_url,
            "progress": progress,
            "total_lessons": total,
            "completed_lessons": completed,
            "enrolled_at": enrollment.enrolled_at,
            "last_accessed": enrollment.last_accessed,
        })
    return out

# --- Chapters Endpoints ---
@app.post("/courses/{course_id}/chapters/")
def create_chapter(
    course_id: int,
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chapter = Chapter(title=title, course_id=course_id)
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter

@app.get("/courses/{course_id}/chapters/")
def get_chapters(course_id: int, db: Session = Depends(get_db)):
    return db.query(Chapter).filter(Chapter.course_id == course_id).all()

# --- Lessons Endpoints ---
@app.post("/chapters/{chapter_id}/lessons/")
def create_lesson(
    chapter_id: int,
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = Lesson(title=title, chapter_id=chapter_id)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson

@app.get("/chapters/{chapter_id}/lessons/")
def get_lessons(chapter_id: int, db: Session = Depends(get_db)):
    return db.query(Lesson).filter(Lesson.chapter_id == chapter_id).all()

@app.post("/lessons/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if lesson.course_id is None:
        raise HTTPException(status_code=400, detail="Lesson has no course")

    enrollment = _ensure_enrollment(db, current_user.id, lesson.course_id)
    existing = (
        db.query(UserLessonProgress)
        .filter(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson_id,
        )
        .first()
    )
    if not existing:
        db.add(UserLessonProgress(user_id=current_user.id, lesson_id=lesson_id))
    # The session has autoflush off, so flush the new row before the
    # progress counts below read it.
    db.flush()

    completed, total, progress = _course_progress(db, current_user.id, lesson.course_id)
    enrollment.progress = progress
    enrollment.last_accessed = datetime.utcnow()
    if progress == 100 and enrollment.completed_at is None:
        enrollment.completed_at = datetime.utcnow()
    db.commit()
    return {
        "lesson_id": lesson_id,
        "course_id": lesson.course_id,
        "completed_lessons": completed,
        "total_lessons": total,
        "progress": progress,
    }

# --- Content Endpoints ---
@app.post("/lessons/{lesson_id}/content/")
def add_content(
    lesson_id: int,
    text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # LessonContent is the join row; the text itself lives in MarkdownContent.
    last = (
        db.query(LessonContent)
        .filter(LessonContent.lesson_id == lesson_id)
        .order_by(LessonContent.sort_order.desc())
        .first()
    )
    content = LessonContent(
        lesson_id=lesson_id,
        content_type="markdown",
        sort_order=(last.sort_order + 1) if last else 1,
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    db.add(MarkdownContent(content_id=content.id, text=text, format="markdown"))
    db.commit()
    return {
        "id": content.id,
        "lesson_id": content.lesson_id,
        "content_type": content.content_type,
        "sort_order": content.sort_order,
    }


def _validate_editor_blocks(blocks: list[EditorBlockIn]) -> None:
    """Semantic checks before anything is deleted (PUT is destructive)."""
    for block in blocks:
        if block.type == "multiple_choice":
            options = [o for o in block.data.options if o.strip()]
            if not options:
                raise HTTPException(
                    status_code=400,
                    detail="A multiple-choice question needs at least one non-empty option",
                )
            if not 0 <= block.data.correctAnswer < len(block.data.options):
                raise HTTPException(
                    status_code=400,
                    detail="correctAnswer is out of range for the question options",
                )
        if block.type in ("multiple_choice", "short_answer"):
            if not block.data.question.strip():
                raise HTTPException(
                    status_code=400, detail="A question needs question text"
                )


@app.put("/lessons/{lesson_id}/content/", response_model=list[LessonContentOut])
def replace_content(
    lesson_id: int,
    blocks: list[EditorBlockIn],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Replace a lesson's whole content list from the editor's blocks.

    Deletes the lesson's existing LessonContent rows (children go with
    them) and inserts the new blocks in order. Visualization blocks are
    stored as-is; code blocks become fenced markdown (there is no code
    content type).
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    _validate_editor_blocks(blocks)

    old_ids = [
        row.id
        for row in db.query(LessonContent.id)
        .filter(LessonContent.lesson_id == lesson_id)
        .all()
    ]
    if old_ids:
        db.query(QuestionOption).filter(
            QuestionOption.question_id.in_(old_ids)
        ).delete(synchronize_session=False)
        db.query(ShortAnswerQuestion).filter(
            ShortAnswerQuestion.question_id.in_(old_ids)
        ).delete(synchronize_session=False)
        db.query(Question).filter(
            Question.content_id.in_(old_ids)
        ).delete(synchronize_session=False)
        db.query(MarkdownContent).filter(
            MarkdownContent.content_id.in_(old_ids)
        ).delete(synchronize_session=False)
        db.query(VisualizationContent).filter(
            VisualizationContent.content_id.in_(old_ids)
        ).delete(synchronize_session=False)
        db.query(LessonContent).filter(
            LessonContent.id.in_(old_ids)
        ).delete(synchronize_session=False)

    for index, block in enumerate(blocks, start=1):
        if block.type == "markdown":
            content = LessonContent(
                lesson_id=lesson_id, content_type="markdown", sort_order=index
            )
            db.add(content)
            db.flush()
            db.add(MarkdownContent(
                content_id=content.id, text=block.data.text, format="markdown"
            ))
        elif block.type == "code":
            content = LessonContent(
                lesson_id=lesson_id, content_type="markdown", sort_order=index
            )
            db.add(content)
            db.flush()
            fenced = f"```{block.data.language}\n{block.data.code}\n```"
            db.add(MarkdownContent(
                content_id=content.id, text=fenced, format="markdown"
            ))
        elif block.type == "visualization":
            content = LessonContent(
                lesson_id=lesson_id, content_type="visualization", sort_order=index
            )
            db.add(content)
            db.flush()
            db.add(VisualizationContent(
                content_id=content.id,
                engine=block.data.engine,
                config=block.data.config,
            ))
        elif block.type == "multiple_choice":
            options = [o for o in block.data.options if o.strip()]
            correct_text = block.data.options[block.data.correctAnswer]
            correct_index = options.index(correct_text)
            content = LessonContent(
                lesson_id=lesson_id, content_type="question", sort_order=index
            )
            db.add(content)
            db.flush()
            db.add(Question(
                content_id=content.id,
                question_format="multiple_choice",
                question_text=block.data.question,
                explanation=block.data.explanation,
            ))
            for i, option_text in enumerate(options, start=1):
                db.add(QuestionOption(
                    question_id=content.id,
                    option_text=option_text,
                    is_correct=(i - 1 == correct_index),
                    sort_order=i,
                ))
        elif block.type == "short_answer":
            content = LessonContent(
                lesson_id=lesson_id, content_type="question", sort_order=index
            )
            db.add(content)
            db.flush()
            db.add(Question(
                content_id=content.id,
                question_format="short_answer",
                question_text=block.data.question,
                explanation=block.data.explanation,
            ))
            db.add(ShortAnswerQuestion(
                question_id=content.id, correct_answer=block.data.answer
            ))

    db.commit()
    return _serialize_lesson_content(db, lesson_id)

@app.get("/lessons/{lesson_id}/content/", response_model=list[LessonContentOut])
def get_lesson_content(lesson_id: int, db: Session = Depends(get_db)):
    return _serialize_lesson_content(db, lesson_id)

# Root endpoint
@app.get("/")
def home():
    return {"message": "Math E-Learning API"}
