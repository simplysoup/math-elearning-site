from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from database import engine, get_db
from models import Base, Course, Chapter, Lesson, LessonContent, MarkdownContent, Question, QuestionOption, ShortAnswerQuestion
from schemas import LessonContentOut, UserCreate, UserLogin
from auth import register_user, login_user
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware


# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] to allow all origins (not recommended for prod)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth Endpoints ---

@app.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    return register_user(user_data, db)

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(user.email, user.password, db)

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
def create_course(title: str, description: str, db: Session = Depends(get_db)):
    course = Course(title=title, description=description)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@app.get("/courses/")
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@app.get("/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

# --- Chapters Endpoints ---
@app.post("/courses/{course_id}/chapters/")
def create_chapter(course_id: int, title: str, db: Session = Depends(get_db)):
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
def create_lesson(chapter_id: int, title: str, db: Session = Depends(get_db)):
    lesson = Lesson(title=title, chapter_id=chapter_id)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson

@app.get("/chapters/{chapter_id}/lessons/")
def get_lessons(chapter_id: int, db: Session = Depends(get_db)):
    return db.query(Lesson).filter(Lesson.chapter_id == chapter_id).all()

# --- Content Endpoints ---
@app.post("/lessons/{lesson_id}/content/")
def add_content(lesson_id: int, text: str, db: Session = Depends(get_db)):
    content = Content(text=text, lesson_id=lesson_id)
    db.add(content)
    db.commit()
    db.refresh(content)
    return content

@app.get("/lessons/{lesson_id}/content/", response_model=list[LessonContentOut])
def get_lesson_content(lesson_id: int, db: Session = Depends(get_db)):
    contents = db.query(LessonContent).filter(LessonContent.lesson_id == lesson_id).order_by(LessonContent.sort_order).all()

    output = []

    for content in contents:
        if content.content_type == 'markdown':
            markdown = db.query(MarkdownContent).filter(MarkdownContent.content_id == content.id).first()
            if not markdown:
                continue
            output.append({
                "type": "markdown",
                "data": {
                    "text": markdown.text,
                    "format": markdown.format
                }
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
                        "visualization": question.visualization
                    }
                })
            elif question.question_format == 'short_answer':
                output.append({
                    "type": "question",
                    "data": {
                        "format": "short_answer",
                        "question": question.question_text,
                        "correct_answer": short_answer.correct_answer if short_answer else "",
                        "explanation": question.explanation,
                        "visualization": question.visualization
                    }
                })

    return output

# Root endpoint
@app.get("/")
def home():
    return {"message": "Math E-Learning API"}