import os
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from jose import JWTError, jwt
from database import engine, get_db
from models import (
    Base, Course, Unit, Lesson, LessonContent, MarkdownContent,
    Question, QuestionOption, ShortAnswerQuestion, User,
    VisualizationContent, CourseStudent, UserLessonProgress,
    CourseView, Star, Exam, ExamQuestion, ExamQuestionOption,
    ExamAttempt, Comment, Tag, CourseTag,
)
from schemas import (
    LessonContentOut, UserCreate, UserLogin, RefreshRequest,
    EditorBlockIn, EnrolledCourseOut, CourseCreate, UserUpdate,
    ExamCreate, ExamAttemptIn, CommentIn,
)
from auth import (
    register_user, login_user, get_current_user, refresh_access_token,
    create_access_token, create_refresh_token, SECRET_KEY, ALGORITHM,
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


def _public_user_full(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
    }


def _tokens_for(user: User) -> dict:
    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


def _optional_user(request: Request, db: Session) -> User | None:
    """Best-effort auth for endpoints that also serve anonymous visitors
    (lesson content, views, exam listings). Returns None when there is
    no usable Authorization header; never raises."""
    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        return None
    token = header[7:].strip()
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") == "refresh":
            return None
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return db.query(User).get(int(user_id))
    except (JWTError, ValueError, TypeError):
        return None


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


# --- Ownership / visibility helpers ---

def _is_owner(course: Course, user: User | None) -> bool:
    """The owner is owner_id when set, else created_by (legacy courses)."""
    if user is None:
        return False
    owner_id = course.owner_id if course.owner_id is not None else course.created_by
    return owner_id is not None and owner_id == user.id


def _get_course(db: Session, course_id: int) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _visible_course(db: Session, course_id: int, user: User | None) -> Course:
    """A course readable by this requester. Private courses 404 for
    anyone who is not the owner, so their existence does not leak."""
    course = _get_course(db, course_id)
    if course.visibility == 'private' and not _is_owner(course, user):
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _owned_course(db: Session, course_id: int, user: User) -> Course:
    """A course the requester owns. 404 when missing, 403 otherwise."""
    course = _get_course(db, course_id)
    if not _is_owner(course, user):
        raise HTTPException(status_code=403, detail="Only the course owner can do this")
    return course


# --- Units, gating, exams: shared helpers ---

def _ordered_units(db: Session, course_id: int) -> list[Unit]:
    return (
        db.query(Unit)
        .filter(Unit.course_id == course_id)
        .order_by(Unit.sort_order.asc().nulls_last(), Unit.id)
        .all()
    )


def _unit_lessons_complete(db: Session, user_id: int | None, unit_id: int) -> bool:
    """Every lesson in the unit is complete for this user. Vacuously
    true for a unit with no lessons; anonymous users complete nothing,
    so only an empty unit counts as complete for them."""
    lesson_ids = [row.id for row in db.query(Lesson.id).filter(Lesson.unit_id == unit_id).all()]
    if not lesson_ids:
        return True
    if user_id is None:
        return False
    done = (
        db.query(UserLessonProgress.lesson_id)
        .filter(
            UserLessonProgress.user_id == user_id,
            UserLessonProgress.lesson_id.in_(lesson_ids),
        )
        .count()
    )
    return done == len(lesson_ids)


def _exam_for_unit(db: Session, unit_id: int) -> Exam | None:
    return db.query(Exam).filter(Exam.unit_id == unit_id).first()


def _final_exam(db: Session, course_id: int) -> Exam | None:
    return (
        db.query(Exam)
        .filter(Exam.course_id == course_id, Exam.is_final == True)  # noqa: E712
        .first()
    )


def _latest_attempt(db: Session, exam_id: int, user_id: int) -> ExamAttempt | None:
    return (
        db.query(ExamAttempt)
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.user_id == user_id)
        .order_by(ExamAttempt.attempted_at.desc(), ExamAttempt.id.desc())
        .first()
    )


def _exam_status(db: Session, exam: Exam, user_id: int | None) -> tuple[str, int | None]:
    """(status, best_score) for one student. Latest attempt decides:
    no attempts -> not_started, latest passed -> passed, otherwise
    failed. There is no separate in-progress state."""
    if user_id is None:
        return "not_started", None
    latest = _latest_attempt(db, exam.id, user_id)
    if latest is None:
        return "not_started", None
    best = (
        db.query(ExamAttempt.score)
        .filter(ExamAttempt.exam_id == exam.id, ExamAttempt.user_id == user_id)
        .order_by(ExamAttempt.score.desc())
        .first()
    )
    return ("passed" if latest.passed else "failed"), (best[0] if best else None)


def _exam_passed(db: Session, exam: Exam, user_id: int | None) -> bool:
    if user_id is None:
        return False
    status, _ = _exam_status(db, exam, user_id)
    return status == "passed"


def _unit_complete(db: Session, user_id: int | None, unit: Unit) -> bool:
    """A unit is complete when every lesson is done and, if the unit
    has an exam, the student has passed it."""
    if not _unit_lessons_complete(db, user_id, unit.id):
        return False
    exam = _exam_for_unit(db, unit.id)
    return exam is None or _exam_passed(db, exam, user_id)


def _unit_unlocked(db: Session, user: User | None, course: Course, unit: Unit) -> bool:
    """The owner always sees everything. The first unit is open to
    everyone. Any later unit unlocks once the previous unit is complete
    (anonymous visitors have no progress, so only the first unit ever
    unlocks for them)."""
    if _is_owner(course, user):
        return True
    units = _ordered_units(db, course.id)
    if not units or units[0].id == unit.id:
        return True
    if user is None:
        return False
    index = next((i for i, u in enumerate(units) if u.id == unit.id), None)
    if index is None or index == 0:
        return True
    return _unit_complete(db, user.id, units[index - 1])


def _exam_locked(db: Session, user: User | None, exam: Exam) -> bool:
    """A unit exam unlocks once every lesson in its unit is complete.
    The final exam unlocks once the final unit is complete."""
    course = _get_course(db, exam.course_id)
    if _is_owner(course, user):
        return False
    user_id = user.id if user else None
    if exam.is_final:
        units = _ordered_units(db, course.id)
        if not units:
            return False
        return not _unit_complete(db, user_id, units[-1])
    unit = db.query(Unit).filter(Unit.id == exam.unit_id).first()
    if unit is None:
        return True
    return not _unit_lessons_complete(db, user_id, unit.id)


def _course_complete(db: Session, user_id: int, course_id: int) -> bool:
    """Every unit complete plus the final exam passed if the course
    has one."""
    units = _ordered_units(db, course_id)
    if not all(_unit_complete(db, user_id, unit) for unit in units):
        return False
    final = _final_exam(db, course_id)
    return final is None or _exam_passed(db, final, user_id)


def _maybe_complete_course(db: Session, user_id: int, course_id: int) -> None:
    """Set completed_at once the course is actually complete."""
    enrollment = (
        db.query(CourseStudent)
        .filter(CourseStudent.course_id == course_id, CourseStudent.user_id == user_id)
        .first()
    )
    if enrollment and enrollment.completed_at is None and _course_complete(db, user_id, course_id):
        enrollment.completed_at = datetime.utcnow()
        db.flush()


def _course_stats(db: Session, course_id: int) -> dict:
    stars = db.query(Star).filter(Star.course_id == course_id).count()
    views = db.query(CourseView).filter(CourseView.course_id == course_id).count()
    completions = (
        db.query(CourseStudent)
        .filter(
            CourseStudent.course_id == course_id,
            CourseStudent.completed_at.isnot(None),
        )
        .count()
    )
    lessons_completed = (
        db.query(UserLessonProgress)
        .join(Lesson, UserLessonProgress.lesson_id == Lesson.id)
        .filter(Lesson.course_id == course_id)
        .count()
    )
    return {
        "stars": stars,
        "views": views,
        "course_completions": completions,
        "lessons_completed": lessons_completed,
    }


def _course_list_item(db: Session, course: Course) -> dict:
    units = _ordered_units(db, course.id)
    stats = _course_stats(db, course.id)
    tags = [
        row.name
        for row in (
            db.query(Tag.name)
            .join(CourseTag, CourseTag.tag_id == Tag.id)
            .filter(CourseTag.course_id == course.id)
            .order_by(Tag.name)
            .all()
        )
    ]
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "image_url": course.image_url,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "created_by": course.created_by,
        "owner_id": course.owner_id,
        "visibility": course.visibility,
        "level": course.level,
        "estimated_time_minutes": course.estimated_time_minutes,
        "prerequisites": course.prerequisites,
        "tags": tags,
        "unit_count": len(units),
        "lesson_count": sum(len(unit.lessons) for unit in units),
        **stats,
    }


def _serialize_exam(db: Session, exam: Exam) -> dict:
    """An exam with its questions, never with correct answers."""
    questions = (
        db.query(ExamQuestion)
        .filter(ExamQuestion.exam_id == exam.id)
        .order_by(ExamQuestion.sort_order.asc().nulls_last(), ExamQuestion.id)
        .all()
    )
    out_questions = []
    for question in questions:
        options = (
            db.query(ExamQuestionOption)
            .filter(ExamQuestionOption.question_id == question.id)
            .order_by(ExamQuestionOption.sort_order.asc().nulls_last(), ExamQuestionOption.id)
            .all()
        )
        out_questions.append({
            "id": question.id,
            "format": question.format.value if hasattr(question.format, "value") else question.format,
            "question": question.question_text,
            "options": [opt.option_text for opt in options],
            "explanation": question.explanation,
            "sort_order": question.sort_order,
        })
    return {
        "id": exam.id,
        "course_id": exam.course_id,
        "unit_id": exam.unit_id,
        "is_final": exam.is_final,
        "title": exam.title,
        "pass_mark": exam.pass_mark,
        "created_at": exam.created_at,
        "questions": out_questions,
    }


def _serialize_comment(comment: Comment) -> dict:
    return {
        "id": comment.id,
        "course_id": comment.course_id,
        "lesson_id": comment.lesson_id,
        "author_id": comment.author_id,
        "username": comment.author.username if comment.author else None,
        "author_name": comment.author.username if comment.author else None,
        "text": comment.text,
        "created_at": comment.created_at,
    }


def _create_exam(db: Session, course: Course, unit: Unit | None, is_final: bool, body: ExamCreate) -> Exam:
    """Validate and store an exam. Multiple-choice answers are the
    option index; a short-answer answer is stored as a single option
    row holding the answer string."""
    for index, question in enumerate(body.questions, start=1):
        if question.format == "multiple_choice":
            if not question.options:
                raise HTTPException(status_code=400, detail="A multiple-choice question needs options")
            if not isinstance(question.correct_answer, int) or isinstance(question.correct_answer, bool):
                raise HTTPException(status_code=400, detail="correct_answer must be an option index for multiple-choice questions")
            if not 0 <= question.correct_answer < len(question.options):
                raise HTTPException(status_code=400, detail="correct_answer is out of range for the question options")
        else:  # short_answer
            if not isinstance(question.correct_answer, str) or not question.correct_answer.strip():
                raise HTTPException(status_code=400, detail="correct_answer must be a non-empty answer string for short-answer questions")

    title = body.title or (f"{unit.title} Exam" if unit else "Final Exam")
    exam = Exam(
        course_id=course.id,
        unit_id=unit.id if unit else None,
        is_final=is_final,
        title=title,
        pass_mark=body.pass_mark,
    )
    db.add(exam)
    db.flush()
    for index, question in enumerate(body.questions, start=1):
        row = ExamQuestion(
            exam_id=exam.id,
            format=question.format,
            question_text=question.question,
            explanation=question.explanation,
            sort_order=index,
        )
        db.add(row)
        db.flush()
        if question.format == "multiple_choice":
            for i, option_text in enumerate(question.options, start=1):
                db.add(ExamQuestionOption(
                    question_id=row.id,
                    option_text=option_text,
                    is_correct=(i - 1 == question.correct_answer),
                    sort_order=i,
                ))
        else:
            db.add(ExamQuestionOption(
                question_id=row.id,
                option_text=question.correct_answer,
                is_correct=True,
                sort_order=1,
            ))
    db.commit()
    db.refresh(exam)
    return exam


# --- Auth Endpoints ---

@app.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = register_user(user_data, db)
    # Auto-login: the frontend stores the tokens and the public user.
    return {**_public_user(user), **_tokens_for(user)}

@app.get("/user")
def get_user(current_user: User = Depends(get_current_user)):
    return _public_user_full(current_user)

@app.put("/user")
def update_user(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = body.model_dump(exclude_unset=True)
    if "username" in updates and updates["username"] is not None:
        clash = (
            db.query(User)
            .filter(User.username == updates["username"], User.id != current_user.id)
            .first()
        )
        if clash:
            raise HTTPException(status_code=409, detail="Username already taken")
    for field, value in updates.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return _public_user_full(current_user)

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
    body: CourseCreate | None = Body(default=None),
    title: str | None = None,
    description: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a course. Takes a JSON body {title, description?, level?,
    estimated_time_minutes?, prerequisites?}; query params are still
    accepted for title/description. New courses start private and are
    owned by the creator."""
    if body is not None:
        title, description = body.title, body.description
        level, estimated_time_minutes, prerequisites = (
            body.level, body.estimated_time_minutes, body.prerequisites,
        )
    else:
        level, estimated_time_minutes, prerequisites = None, None, None
    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    course = Course(
        title=title,
        description=description,
        created_by=current_user.id,
        owner_id=current_user.id,
        visibility='private',
        level=level,
        estimated_time_minutes=estimated_time_minutes,
        prerequisites=prerequisites,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@app.get("/courses/")
def get_courses(sort: str = "newest", db: Session = Depends(get_db)):
    """The public catalogue: published courses only, for everyone.
    sort=stars|views|completions|newest (default newest)."""
    if sort not in ("stars", "views", "completions", "newest"):
        raise HTTPException(status_code=400, detail="sort must be stars, views, completions, or newest")
    courses = db.query(Course).filter(Course.visibility == 'published').all()
    items = [_course_list_item(db, course) for course in courses]
    if sort == "stars":
        items.sort(key=lambda item: (-item["stars"], item["id"]))
    elif sort == "views":
        items.sort(key=lambda item: (-item["views"], item["id"]))
    elif sort == "completions":
        items.sort(key=lambda item: (-item["course_completions"], item["id"]))
    else:  # newest
        items.sort(key=lambda item: (item["created_at"] is None, item["created_at"], item["id"]), reverse=True)
    return items

@app.get("/courses/{course_id}")
def get_course(course_id: int, request: Request, db: Session = Depends(get_db)):
    user = _optional_user(request, db)
    course = _visible_course(db, course_id, user)
    # The detail page reads the same shape as the list: stats and tag
    # names included, not the raw ORM row.
    return _course_list_item(db, course)

@app.post("/courses/{course_id}/publish")
def publish_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _owned_course(db, course_id, current_user)
    course.visibility = 'published'
    db.commit()
    db.refresh(course)
    return course

@app.post("/courses/{course_id}/unpublish")
def unpublish_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _owned_course(db, course_id, current_user)
    course.visibility = 'private'
    db.commit()
    db.refresh(course)
    return course

@app.post("/courses/{course_id}/enroll")
def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _get_course(db, course_id)
    if course.visibility == 'private' and not _is_owner(course, current_user):
        raise HTTPException(status_code=403, detail="Course is private")
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

@app.get("/me/teaching")
def get_my_teaching(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Courses owned by the current user, private and published."""
    courses = (
        db.query(Course)
        .filter(or_(
            Course.owner_id == current_user.id,
            (Course.owner_id.is_(None)) & (Course.created_by == current_user.id),
        ))
        .order_by(Course.created_at.desc(), Course.id.desc())
        .all()
    )
    return [_course_list_item(db, course) for course in courses]

@app.get("/courses/{course_id}/students")
def get_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Teacher roster: each enrolled student's history in this course.
    Owner only."""
    course = _owned_course(db, course_id, current_user)
    enrollments = (
        db.query(CourseStudent)
        .filter(CourseStudent.course_id == course_id)
        .order_by(CourseStudent.enrolled_at)
        .all()
    )
    units = _ordered_units(db, course_id)
    exams = db.query(Exam).filter(Exam.course_id == course_id).all()
    total_lessons = db.query(Lesson).filter(Lesson.course_id == course_id).count()
    out = []
    for enrollment in enrollments:
        student = db.query(User).filter(User.id == enrollment.user_id).first()
        completed, _, progress = _course_progress(db, enrollment.user_id, course_id)
        unit_rows = []
        for unit in units:
            exam = _exam_for_unit(db, unit.id)
            status, _ = _exam_status(db, exam, enrollment.user_id) if exam else (None, None)
            unit_rows.append({
                "unit_id": unit.id,
                "title": unit.title,
                "complete": _unit_complete(db, enrollment.user_id, unit),
                "exam_status": status,
            })
        exam_rows = []
        for exam in exams:
            status, best = _exam_status(db, exam, enrollment.user_id)
            exam_rows.append({
                "exam_id": exam.id,
                "title": exam.title,
                "status": status,
                "best_score": best,
            })
        out.append({
            "user_id": enrollment.user_id,
            "username": student.username if student else None,
            "email": student.email if student else None,
            "enrolled_at": enrollment.enrolled_at,
            "lessons_completed": completed,
            "total_lessons": total_lessons,
            "progress": progress,
            "units": unit_rows,
            "exams": exam_rows,
            "last_accessed": enrollment.last_accessed,
        })
    return out

@app.get("/courses/{course_id}/progress")
def get_my_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The requesting student's own progress in this course."""
    course = _visible_course(db, course_id, current_user)
    completed, total, progress = _course_progress(db, current_user.id, course_id)
    units = _ordered_units(db, course_id)
    unit_rows = []
    for unit in units:
        exam = _exam_for_unit(db, unit.id)
        status, _ = _exam_status(db, exam, current_user.id) if exam else (None, None)
        unit_rows.append({
            "unit_id": unit.id,
            "title": unit.title,
            "complete": _unit_complete(db, current_user.id, unit),
            "locked": not _unit_unlocked(db, current_user, course, unit),
            "exam_status": status,
        })
    final = _final_exam(db, course_id)
    final_status, _ = _exam_status(db, final, current_user.id) if final else (None, None)
    return {
        "course_id": course_id,
        "completed_lessons": completed,
        "total_lessons": total,
        "progress": progress,
        "units": unit_rows,
        "final_exam_status": final_status,
        "course_complete": _course_complete(db, current_user.id, course_id),
    }

@app.post("/courses/{course_id}/view")
def record_course_view(course_id: int, request: Request, db: Session = Depends(get_db)):
    """Record one page view. No auth required; the owner's own views
    are not recorded. Returns the current view count."""
    user = _optional_user(request, db)
    course = _visible_course(db, course_id, user)
    if user is None or not _is_owner(course, user):
        db.add(CourseView(course_id=course_id, user_id=user.id if user else None))
        db.commit()
    return {"views": db.query(CourseView).filter(CourseView.course_id == course_id).count()}

@app.get("/courses/{course_id}/stats")
def get_course_stats(course_id: int, request: Request, db: Session = Depends(get_db)):
    course = _visible_course(db, course_id, _optional_user(request, db))
    return _course_stats(db, course.id)

# --- Units Endpoints ---
@app.post("/courses/{course_id}/units/")
def create_unit(
    course_id: int,
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _owned_course(db, course_id, current_user)
    unit = Unit(title=title, course_id=course.id)
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit

@app.get("/courses/{course_id}/units/")
def get_units(course_id: int, request: Request, db: Session = Depends(get_db)):
    user = _optional_user(request, db)
    course = _visible_course(db, course_id, user)
    out = []
    for unit in _ordered_units(db, course.id):
        out.append({
            "id": unit.id,
            "course_id": unit.course_id,
            "title": unit.title,
            "description": unit.description,
            "image_url": unit.image_url,
            "sort_order": unit.sort_order,
            "lesson_count": db.query(Lesson).filter(Lesson.unit_id == unit.id).count(),
            "locked": not _unit_unlocked(db, user, course, unit),
        })
    return out

# --- Lessons Endpoints ---
@app.post("/units/{unit_id}/lessons/")
def create_lesson(
    unit_id: int,
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    course = _owned_course(db, unit.course_id, current_user)
    lesson = Lesson(title=title, unit_id=unit.id, course_id=course.id)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson

@app.get("/units/{unit_id}/lessons/")
def get_lessons(unit_id: int, request: Request, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    user = _optional_user(request, db)
    _visible_course(db, unit.course_id, user)
    lessons = (
        db.query(Lesson)
        .filter(Lesson.unit_id == unit_id)
        .order_by(Lesson.sort_order.asc().nulls_last(), Lesson.id)
        .all()
    )
    done_ids = set()
    if user is not None:
        done_ids = {
            row.lesson_id
            for row in db.query(UserLessonProgress.lesson_id)
            .filter(
                UserLessonProgress.user_id == user.id,
                UserLessonProgress.lesson_id.in_([l.id for l in lessons]),
            )
            .all()
        }
    return [
        {
            "id": lesson.id,
            "course_id": lesson.course_id,
            "unit_id": lesson.unit_id,
            "title": lesson.title,
            "description": lesson.description,
            "sort_order": lesson.sort_order,
            "completed": lesson.id in done_ids,
        }
        for lesson in lessons
    ]

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
    course = _visible_course(db, lesson.course_id, current_user)
    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    if unit is not None and not _unit_unlocked(db, current_user, course, unit):
        raise HTTPException(status_code=403, detail="Unit is locked")

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
    # completed_at only when the course is actually complete: every
    # unit complete plus the final exam passed if the course has one.
    # Progress percent stays lessons-based.
    if enrollment.completed_at is None:
        _maybe_complete_course(db, current_user.id, lesson.course_id)
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
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    _owned_course(db, lesson.course_id, current_user)
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
    _owned_course(db, lesson.course_id, current_user)
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
def get_lesson_content(lesson_id: int, request: Request, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    user = _optional_user(request, db)
    course = _visible_course(db, lesson.course_id, user)
    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    if unit is not None and not _unit_unlocked(db, user, course, unit):
        raise HTTPException(status_code=403, detail="Unit is locked")
    return _serialize_lesson_content(db, lesson_id)

# --- Exams Endpoints ---

@app.post("/courses/{course_id}/units/{unit_id}/exam")
def create_unit_exam(
    course_id: int,
    unit_id: int,
    body: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _owned_course(db, course_id, current_user)
    unit = db.query(Unit).filter(Unit.id == unit_id, Unit.course_id == course_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    if _exam_for_unit(db, unit_id) is not None:
        raise HTTPException(status_code=409, detail="This unit already has an exam")
    exam = _create_exam(db, course, unit, False, body)
    return _serialize_exam(db, exam)

@app.post("/courses/{course_id}/final-exam")
def create_final_exam(
    course_id: int,
    body: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _owned_course(db, course_id, current_user)
    if _final_exam(db, course_id) is not None:
        raise HTTPException(status_code=409, detail="This course already has a final exam")
    exam = _create_exam(db, course, None, True, body)
    return _serialize_exam(db, exam)

@app.get("/courses/{course_id}/exams")
def list_course_exams(course_id: int, request: Request, db: Session = Depends(get_db)):
    user = _optional_user(request, db)
    course = _visible_course(db, course_id, user)
    exams = db.query(Exam).filter(Exam.course_id == course_id).all()
    units = _ordered_units(db, course_id)
    unit_order = {unit.id: i for i, unit in enumerate(units)}
    exams.sort(key=lambda e: (1 if e.is_final else 0, unit_order.get(e.unit_id, 0), e.id))
    out = []
    for exam in exams:
        status, _ = _exam_status(db, exam, user.id if user else None)
        out.append({
            "id": exam.id,
            "unit_id": exam.unit_id,
            "is_final": exam.is_final,
            "title": exam.title,
            "pass_mark": exam.pass_mark,
            "locked": _exam_locked(db, user, exam),
            "status": status if user else None,
        })
    return out

@app.get("/exams/{exam_id}")
def get_exam(exam_id: int, request: Request, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    user = _optional_user(request, db)
    _visible_course(db, exam.course_id, user)
    if _exam_locked(db, user, exam):
        raise HTTPException(status_code=403, detail="Exam is locked")
    return _serialize_exam(db, exam)

@app.post("/exams/{exam_id}/attempts")
def attempt_exam(
    exam_id: int,
    body: ExamAttemptIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    course = _get_course(db, exam.course_id)
    if course.visibility == 'private' and not _is_owner(course, current_user):
        raise HTTPException(status_code=403, detail="Course is private")
    if _exam_locked(db, current_user, exam):
        raise HTTPException(status_code=403, detail="Exam is locked")

    questions = (
        db.query(ExamQuestion)
        .filter(ExamQuestion.exam_id == exam.id)
        .order_by(ExamQuestion.sort_order.asc().nulls_last(), ExamQuestion.id)
        .all()
    )
    answers = {a.question_id: a.answer for a in body.answers}
    correct = 0
    for question in questions:
        if question.id not in answers:
            continue
        answer = answers[question.id]
        options = (
            db.query(ExamQuestionOption)
            .filter(ExamQuestionOption.question_id == question.id)
            .order_by(ExamQuestionOption.sort_order.asc().nulls_last(), ExamQuestionOption.id)
            .all()
        )
        if question.format == "multiple_choice" or getattr(question.format, "value", question.format) == "multiple_choice":
            correct_index = next((i for i, opt in enumerate(options) if opt.is_correct), None)
            if isinstance(answer, int) and not isinstance(answer, bool) and answer == correct_index:
                correct += 1
        else:  # short_answer
            expected = next((opt.option_text for opt in options if opt.is_correct), "")
            if isinstance(answer, str) and answer.strip().lower() == expected.strip().lower():
                correct += 1
    total = len(questions)
    score = round(100 * correct / total) if total else 0
    passed = score >= exam.pass_mark
    attempt = ExamAttempt(exam_id=exam.id, user_id=current_user.id, score=score, passed=passed)
    db.add(attempt)
    enrollment = _ensure_enrollment(db, current_user.id, exam.course_id)
    enrollment.last_accessed = datetime.utcnow()
    db.flush()
    if passed:
        _maybe_complete_course(db, current_user.id, exam.course_id)
    db.commit()
    db.refresh(attempt)
    return {"attempt_id": attempt.id, "score": score, "passed": passed, "total": total}

@app.get("/exams/{exam_id}/attempts")
def list_my_attempts(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    _visible_course(db, exam.course_id, current_user)
    total = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).count()
    attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.user_id == current_user.id)
        .order_by(ExamAttempt.attempted_at.desc(), ExamAttempt.id.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "exam_id": a.exam_id,
            "user_id": a.user_id,
            "score": a.score,
            "passed": a.passed,
            "total": total,
            "attempted_at": a.attempted_at,
        }
        for a in attempts
    ]

# --- Stars Endpoints ---

@app.post("/courses/{course_id}/star")
def star_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Star a course. Eligible only after completing at least one unit
    (and passing that unit's exam if it has one). One star per person."""
    course = _visible_course(db, course_id, current_user)
    existing = (
        db.query(Star)
        .filter(Star.course_id == course_id, Star.user_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Course already starred")
    eligible = any(
        _unit_complete(db, current_user.id, unit)
        for unit in _ordered_units(db, course_id)
    )
    if not eligible:
        raise HTTPException(status_code=403, detail="Complete a unit to star this course")
    db.add(Star(course_id=course_id, user_id=current_user.id))
    db.commit()
    return {"starred": True, "stars": db.query(Star).filter(Star.course_id == course_id).count()}

@app.get("/courses/{course_id}/star")
def get_star(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _visible_course(db, course_id, current_user)
    starred = (
        db.query(Star)
        .filter(Star.course_id == course.id, Star.user_id == current_user.id)
        .first()
        is not None
    )
    return {"starred": starred}

# --- Comments Endpoints ---

@app.get("/courses/{course_id}/comments")
def list_course_comments(course_id: int, request: Request, db: Session = Depends(get_db)):
    course = _visible_course(db, course_id, _optional_user(request, db))
    comments = (
        db.query(Comment)
        .filter(Comment.course_id == course.id, Comment.lesson_id.is_(None))
        .order_by(Comment.created_at, Comment.id)
        .all()
    )
    return [_serialize_comment(c) for c in comments]

@app.post("/courses/{course_id}/comments")
def post_course_comment(
    course_id: int,
    body: CommentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _visible_course(db, course_id, current_user)
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Comment text is required")
    comment = Comment(course_id=course.id, lesson_id=None, author_id=current_user.id, text=body.text)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _serialize_comment(comment)

@app.get("/lessons/{lesson_id}/comments")
def list_lesson_comments(lesson_id: int, request: Request, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    user = _optional_user(request, db)
    course = _visible_course(db, lesson.course_id, user)
    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    if unit is not None and not _unit_unlocked(db, user, course, unit):
        raise HTTPException(status_code=403, detail="Unit is locked")
    comments = (
        db.query(Comment)
        .filter(Comment.lesson_id == lesson_id)
        .order_by(Comment.created_at, Comment.id)
        .all()
    )
    return [_serialize_comment(c) for c in comments]

@app.post("/lessons/{lesson_id}/comments")
def post_lesson_comment(
    lesson_id: int,
    body: CommentIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    course = _visible_course(db, lesson.course_id, current_user)
    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    if unit is not None and not _unit_unlocked(db, current_user, course, unit):
        raise HTTPException(status_code=403, detail="Unit is locked")
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Comment text is required")
    comment = Comment(course_id=course.id, lesson_id=lesson_id, author_id=current_user.id, text=body.text)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _serialize_comment(comment)

@app.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    course = _get_course(db, comment.course_id)
    if comment.author_id != current_user.id and not _is_owner(course, current_user):
        raise HTTPException(status_code=403, detail="Only the author or the course owner can delete this comment")
    db.delete(comment)
    db.commit()
    return {"deleted": True}

# Root endpoint
@app.get("/")
def home():
    return {"message": "Math E-Learning API"}
