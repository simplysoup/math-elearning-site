"""Seed the sample course. Idempotent: does nothing if any course exists.

Run after `alembic upgrade head` (see entrypoint.sh). This replaces the
old db/init.sql seed, which only ran on a fresh Postgres container and
could not run after migrations created the tables.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import (
    Chapter,
    Course,
    CourseTag,
    Lesson,
    LessonContent,
    MarkdownContent,
    Question,
    QuestionOption,
    Tag,
    VisualizationContent,
)


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(Course).first():
            print("Seed: courses already exist, skipping.")
            return

        course = Course(
            title="Foundational Algebra",
            description="Master core algebraic concepts",
            image_url="/assets/algebra.jpeg",
        )
        db.add(course)
        db.flush()

        for name in ("algebra", "math", "beginner"):
            tag = db.query(Tag).filter(Tag.name == name).first()
            if not tag:
                tag = Tag(name=name)
                db.add(tag)
                db.flush()
            db.add(CourseTag(course_id=course.id, tag_id=tag.id))

        chapter = Chapter(
            course_id=course.id,
            title="Variables & Expressions",
            description="Introduction to algebraic variables",
            image_url="/images/algebra-variables.jpg",
            sort_order=1,
        )
        db.add(chapter)
        db.flush()

        lesson = Lesson(
            chapter_id=chapter.id,
            course_id=course.id,
            title="Algebraic Variables",
            description="Understanding variables in algebra",
            sort_order=1,
        )
        db.add(lesson)
        db.flush()

        markdown = LessonContent(
            lesson_id=lesson.id, content_type="markdown", sort_order=1
        )
        db.add(markdown)
        db.flush()
        db.add(
            MarkdownContent(
                content_id=markdown.id,
                text="In algebra, variables (like $x$ or $y$) represent unknown values...",
                format="latex",
            )
        )

        viz = LessonContent(
            lesson_id=lesson.id, content_type="visualization", sort_order=2
        )
        db.add(viz)
        db.flush()
        db.add(
            VisualizationContent(
                content_id=viz.id,
                engine="custom",
                config={
                    "kind": "linear-combine",
                    "title": "Combine like terms: ax + bx",
                    "prompt": "Move the sliders. What happens to 3x + 2x as x changes — and what single term is it equal to?",
                    "a": 3,
                    "b": 2,
                    "x": 4,
                    "a_min": 1,
                    "a_max": 5,
                    "b_min": 1,
                    "b_max": 5,
                    "x_min": 0,
                    "x_max": 10,
                },
            )
        )

        question = LessonContent(
            lesson_id=lesson.id, content_type="question", sort_order=3
        )
        db.add(question)
        db.flush()
        db.add(
            Question(
                content_id=question.id,
                question_format="multiple_choice",
                question_text="What does $3x + 2x$ simplify to when $x=4$?",
                explanation="Combine like terms: $3x + 2x = 5x$. When $x=4$, $5x = 20$.",
            )
        )
        db.flush()
        for i, (text, correct) in enumerate(
            [("20", True), ("24", False), ("80", False), ("16", False)],
            start=1,
        ):
            db.add(
                QuestionOption(
                    question_id=question.id,
                    option_text=text,
                    is_correct=correct,
                    sort_order=i,
                )
            )

        db.commit()
        print("Seed: created Foundational Algebra sample course.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
