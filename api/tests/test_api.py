"""Smoke tests: the public lesson flow works end to end."""


def test_root(client):
    assert client.get("/").json() == {"message": "Math E-Learning API"}


def test_lesson_content_returns_markdown_visualization_question(client):
    res = client.get("/lessons/1/content/")
    assert res.status_code == 200
    types = [block["type"] for block in res.json()]
    assert types == ["markdown", "visualization", "question"]


def test_visualization_block_is_the_combine_like_terms_graph(client):
    res = client.get("/lessons/1/content/")
    viz = res.json()[1]
    assert viz["data"]["engine"] == "custom"
    assert viz["data"]["config"]["kind"] == "linear-combine"
    assert viz["data"]["config"]["a"] == 3
    assert viz["data"]["config"]["b"] == 2
    assert viz["data"]["config"]["x"] == 4


def test_register_login_and_get_user(client):
    res = client.post(
        "/register",
        json={"email": "test@example.com", "password": "correct horse battery staple", "username": "tester"},
    )
    assert res.status_code == 200, res.text
    res = client.post(
        "/login", json={"email": "test@example.com", "password": "correct horse battery staple"}
    )
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    res = client.get("/user", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"


def test_register_same_display_name_twice_succeeds(client):
    # The signup form sends the full name as the username; a second user
    # with the same name must not fail with a 500 on the unique column.
    res = client.post(
        "/register",
        json={"email": "same1@example.com", "password": "correct horse battery staple", "username": "Same Name"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["username"] == "Same Name"
    res = client.post(
        "/register",
        json={"email": "same2@example.com", "password": "correct horse battery staple", "username": "Same Name"},
    )
    assert res.status_code == 200, res.text
    assert res.json()["username"] == "Same Name-2"
    # The duplicate email case still rejects cleanly.
    res = client.post(
        "/register",
        json={"email": "same1@example.com", "password": "correct horse battery staple", "username": "Other Name"},
    )
    assert res.status_code == 400, res.text


def test_invalid_token_is_unauthorized(client):
    res = client.get("/user", headers={"Authorization": "Bearer not-a-token"})
    assert res.status_code == 401


def _auth_headers(client, email):
    """Register + login, returning Authorization headers for the new user."""
    res = client.post(
        "/register",
        json={"email": email, "password": "correct horse battery staple", "username": email.split("@")[0]},
    )
    assert res.status_code == 200, res.text
    res = client.post(
        "/login", json={"email": email, "password": "correct horse battery staple"}
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}, res.json()


def test_unit_and_lesson_create_accept_json_body(client):
    # The editor sends {"title": ...} as a JSON body, not a query param;
    # the endpoints must accept that contract (a query-param-only
    # signature 422s the editor while the older tests still pass).
    headers, _ = _auth_headers(client, "jsonbody@example.com")
    res = client.post("/courses/", json={"title": "JSON Body Course"}, headers=headers)
    assert res.status_code == 200, res.text
    course_id = res.json()["id"]
    res = client.post(
        f"/courses/{course_id}/units/", json={"title": "Unit One"}, headers=headers
    )
    assert res.status_code == 200, res.text
    unit_id = res.json()["id"]
    res = client.post(
        f"/units/{unit_id}/lessons/", json={"title": "Lesson One"}, headers=headers
    )
    assert res.status_code == 200, res.text
    assert res.json()["title"] == "Lesson One"
    # The query-param form still works too.
    res = client.post(
        f"/courses/{course_id}/units/", params={"title": "Unit Two"}, headers=headers
    )
    assert res.status_code == 200, res.text


def test_register_returns_tokens_and_refresh_flow(client):
    res = client.post(
        "/register",
        json={"email": "refresh@example.com", "password": "correct horse battery staple", "username": "refresher"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["email"] == "refresh@example.com"
    assert "password" not in body

    # A refresh token is not an access token.
    res = client.get("/user", headers={"Authorization": f"Bearer {body['refresh_token']}"})
    assert res.status_code == 401

    res = client.post("/refresh", json={"refresh_token": body["refresh_token"]})
    assert res.status_code == 200, res.text
    new_access = res.json()["access_token"]
    res = client.get("/user", headers={"Authorization": f"Bearer {new_access}"})
    assert res.status_code == 200
    assert res.json()["email"] == "refresh@example.com"

    # A bogus refresh token is rejected.
    res = client.post("/refresh", json={"refresh_token": "not-a-token"})
    assert res.status_code == 401


def test_unauthenticated_writes_are_unauthorized(client):
    res = client.post("/courses/", json={"title": "Nope", "description": "no auth"})
    assert res.status_code == 401
    res = client.put(
        "/lessons/1/content/",
        json=[{"type": "markdown", "data": {"text": "x"}}],
    )
    assert res.status_code == 401
    res = client.post("/courses/1/enroll")
    assert res.status_code == 401
    res = client.post("/lessons/1/complete")
    assert res.status_code == 401


def test_content_replace_round_trip(client):
    headers, _ = _auth_headers(client, "editor@example.com")
    res = client.post(
        "/courses/",
        json={"title": "Editor Course", "description": "made in a test"},
        headers=headers,
    )
    assert res.status_code == 200, res.text
    course_id = res.json()["id"]
    res = client.post(
        f"/courses/{course_id}/units/",
        params={"title": "Unit One"},
        headers=headers,
    )
    assert res.status_code == 200, res.text
    unit_id = res.json()["id"]
    res = client.post(
        f"/units/{unit_id}/lessons/",
        params={"title": "Lesson One"},
        headers=headers,
    )
    assert res.status_code == 200, res.text
    lesson_id = res.json()["id"]
    # The new course starts private; publish it so the anonymous GETs
    # below can read the lesson content.
    res = client.post(f"/courses/{course_id}/publish", headers=headers)
    assert res.status_code == 200, res.text

    blocks = [
        {"type": "markdown", "data": {"text": "Intro text"}},
        {
            "type": "multiple_choice",
            "data": {
                "question": "What is 2 + 2?",
                "options": ["3", "4", "5"],
                "correctAnswer": 1,
            },
        },
        {
            "type": "short_answer",
            "data": {"question": "What is 3 + 3?", "answer": "6"},
        },
        {"type": "code", "data": {"code": "print(2 + 2)", "language": "python"}},
    ]
    res = client.put(f"/lessons/{lesson_id}/content/", json=blocks, headers=headers)
    assert res.status_code == 200, res.text
    saved = res.json()
    assert [b["type"] for b in saved] == ["markdown", "question", "question", "markdown"]
    assert saved[0]["data"]["text"] == "Intro text"
    assert saved[1]["data"]["options"] == ["3", "4", "5"]
    assert saved[1]["data"]["correct_answer"] == 1
    assert saved[2]["data"]["correct_answer"] == "6"
    assert "print(2 + 2)" in saved[3]["data"]["text"]
    assert saved[3]["data"]["text"].startswith("```python")

    # GET shows the same list, and a second PUT replaces (not appends).
    res = client.get(f"/lessons/{lesson_id}/content/")
    assert res.status_code == 200
    assert [b["type"] for b in res.json()] == ["markdown", "question", "question", "markdown"]
    res = client.put(
        f"/lessons/{lesson_id}/content/",
        json=[{"type": "markdown", "data": {"text": "Only this now"}}],
        headers=headers,
    )
    assert res.status_code == 200, res.text
    assert [b["type"] for b in res.json()] == ["markdown"]
    res = client.get(f"/lessons/{lesson_id}/content/")
    assert [b["data"]["text"] for b in res.json()] == ["Only this now"]

    # A multiple-choice block with no usable options is rejected, and
    # the existing content survives the failed save.
    res = client.put(
        f"/lessons/{lesson_id}/content/",
        json=[{"type": "multiple_choice", "data": {"question": "q?", "options": ["", "  "], "correctAnswer": 0}}],
        headers=headers,
    )
    assert res.status_code == 400
    res = client.get(f"/lessons/{lesson_id}/content/")
    assert [b["data"]["text"] for b in res.json()] == ["Only this now"]


def test_enroll_complete_and_progress(client):
    headers, _ = _auth_headers(client, "learner@example.com")
    # The seeded course has exactly one lesson, so completing it is 100%.
    res = client.post("/courses/1/enroll", headers=headers)
    assert res.status_code == 200, res.text
    res = client.post("/courses/1/enroll", headers=headers)
    assert res.status_code == 200, res.text  # idempotent

    res = client.post("/lessons/1/complete", headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["progress"] == 100
    assert res.json()["completed_lessons"] == 1
    assert res.json()["total_lessons"] == 1

    # Completing again is a no-op, not a double count.
    res = client.post("/lessons/1/complete", headers=headers)
    assert res.json()["progress"] == 100

    res = client.get("/me/courses", headers=headers)
    assert res.status_code == 200, res.text
    mine = res.json()
    assert len(mine) == 1
    assert mine[0]["course_id"] == 1
    assert mine[0]["title"] == "Foundational Algebra"
    assert mine[0]["progress"] == 100
    assert mine[0]["completed_lessons"] == 1
    assert mine[0]["total_lessons"] == 1

    # Completing a lesson auto-enrolls the user in that course.
    headers2, _ = _auth_headers(client, "late-enroller@example.com")
    res = client.post("/lessons/1/complete", headers=headers2)
    assert res.status_code == 200, res.text
    res = client.get("/me/courses", headers=headers2)
    assert len(res.json()) == 1
    assert res.json()[0]["progress"] == 100


def test_course_list_returns_unit_and_lesson_counts(client):
    res = client.get("/courses/")
    assert res.status_code == 200, res.text
    # The suite shares one seeded DB and other tests create courses, so
    # find the seeded course by title rather than asserting the total.
    courses = [c for c in res.json() if c["title"] == "Foundational Algebra"]
    assert len(courses) == 1
    # The seeded course has exactly 1 unit with exactly 1 lesson.
    assert courses[0]["unit_count"] == 1
    assert courses[0]["lesson_count"] == 1
    assert courses[0]["visibility"] == "published"
    assert courses[0]["stars"] == 0
    assert courses[0]["views"] == 0
    # test_enroll_complete_and_progress ran earlier and completed the
    # seeded course's only lesson for two users.
    assert courses[0]["course_completions"] == 2
    assert courses[0]["lessons_completed"] == 2


def _make_course(client, headers, title, units=1, lessons_per_unit=1, publish=False):
    """Create a course with `units` units of `lessons_per_unit` lessons
    each. Returns (course_id, [unit_ids], [lesson_ids])."""
    res = client.post("/courses/", json={"title": title}, headers=headers)
    assert res.status_code == 200, res.text
    course_id = res.json()["id"]
    assert res.json()["visibility"] == "private"
    unit_ids, lesson_ids = [], []
    for u in range(units):
        res = client.post(
            f"/courses/{course_id}/units/", params={"title": f"Unit {u + 1}"}, headers=headers
        )
        assert res.status_code == 200, res.text
        unit_ids.append(res.json()["id"])
        for n in range(lessons_per_unit):
            res = client.post(
                f"/units/{unit_ids[-1]}/lessons/",
                params={"title": f"Lesson {u + 1}.{n + 1}"},
                headers=headers,
            )
            assert res.status_code == 200, res.text
            lesson_ids.append(res.json()["id"])
    if publish:
        res = client.post(f"/courses/{course_id}/publish", headers=headers)
        assert res.status_code == 200, res.text
        assert res.json()["visibility"] == "published"
    return course_id, unit_ids, lesson_ids


def test_non_owner_cannot_edit_or_publish(client):
    owner, _ = _auth_headers(client, "owner1@example.com")
    other, _ = _auth_headers(client, "other1@example.com")
    course_id, unit_ids, lesson_ids = _make_course(client, owner, "Owner Course 1")

    # Non-owner cannot create units/lessons or edit content.
    res = client.post(f"/courses/{course_id}/units/", params={"title": "Nope"}, headers=other)
    assert res.status_code == 403, res.text
    res = client.post(f"/units/{unit_ids[0]}/lessons/", params={"title": "Nope"}, headers=other)
    assert res.status_code == 403, res.text
    res = client.post(f"/lessons/{lesson_ids[0]}/content/", params={"text": "x"}, headers=other)
    assert res.status_code == 403, res.text
    res = client.put(
        f"/lessons/{lesson_ids[0]}/content/",
        json=[{"type": "markdown", "data": {"text": "x"}}],
        headers=other,
    )
    assert res.status_code == 403, res.text
    # Non-owner cannot publish or unpublish.
    res = client.post(f"/courses/{course_id}/publish", headers=other)
    assert res.status_code == 403, res.text
    res = client.post(f"/courses/{course_id}/unpublish", headers=other)
    assert res.status_code == 403, res.text
    # The owner can.
    res = client.post(f"/courses/{course_id}/publish", headers=owner)
    assert res.status_code == 200, res.text


def test_private_course_is_invisible_to_others(client):
    owner, _ = _auth_headers(client, "owner2@example.com")
    other, _ = _auth_headers(client, "other2@example.com")
    course_id, unit_ids, _ = _make_course(client, owner, "Private Course 2")

    res = client.get(f"/courses/{course_id}", headers=other)
    assert res.status_code == 404, res.text
    res = client.get(f"/courses/{course_id}/units/", headers=other)
    assert res.status_code == 404, res.text
    res = client.get(f"/courses/{course_id}")
    assert res.status_code == 404, res.text
    titles = [c["title"] for c in client.get("/courses/").json()]
    assert "Private Course 2" not in titles
    # Enrolling in a private course is forbidden for non-owners.
    res = client.post(f"/courses/{course_id}/enroll", headers=other)
    assert res.status_code == 403, res.text
    # The owner sees their own private course.
    res = client.get(f"/courses/{course_id}", headers=owner)
    assert res.status_code == 200, res.text
    res = client.get(f"/courses/{course_id}/units/", headers=owner)
    assert res.status_code == 200, res.text
    assert len(res.json()) == 1
    # ... and in /me/teaching, but not in the public list.
    mine = client.get("/me/teaching", headers=owner).json()
    assert any(c["id"] == course_id for c in mine)
    titles = [c["title"] for c in client.get("/courses/").json()]
    assert "Private Course 2" not in titles


def test_gating_second_unit_locked_until_first_complete(client):
    owner, _ = _auth_headers(client, "owner3@example.com")
    student, _ = _auth_headers(client, "student3@example.com")
    course_id, _, lesson_ids = _make_course(
        client, owner, "Gated Course 3", units=2, lessons_per_unit=1, publish=True
    )
    first, second = lesson_ids

    # Anonymous visitors see only the first unit.
    assert client.get(f"/lessons/{first}/content/").status_code == 200
    assert client.get(f"/lessons/{second}/content/").status_code == 403
    # A logged-in student also cannot read or complete the second unit yet.
    res = client.get(f"/lessons/{second}/content/", headers=student)
    assert res.status_code == 403, res.text
    res = client.post(f"/lessons/{second}/complete", headers=student)
    assert res.status_code == 403, res.text

    # Completing the first unit unlocks the second.
    res = client.post(f"/lessons/{first}/complete", headers=student)
    assert res.status_code == 200, res.text
    res = client.get(f"/lessons/{second}/content/", headers=student)
    assert res.status_code == 200, res.text
    res = client.post(f"/lessons/{second}/complete", headers=student)
    assert res.status_code == 200, res.text


def test_exam_pass_fail_scoring_and_unlimited_retakes(client):
    owner, _ = _auth_headers(client, "owner4@example.com")
    student, _ = _auth_headers(client, "student4@example.com")
    course_id, unit_ids, lesson_ids = _make_course(
        client, owner, "Exam Course 4", units=1, lessons_per_unit=1, publish=True
    )
    exam_body = {
        "title": "Unit Exam",
        "pass_mark": 70,
        "questions": [
            {
                "format": "multiple_choice",
                "question": "What is 2 + 2?",
                "options": ["3", "4", "5"],
                "correct_answer": 1,
            },
            {
                "format": "short_answer",
                "question": "What is 3 + 3?",
                "correct_answer": "6",
            },
        ],
    }
    res = client.post(
        f"/courses/{course_id}/units/{unit_ids[0]}/exam", json=exam_body, headers=owner
    )
    assert res.status_code == 200, res.text
    exam_id = res.json()["id"]
    # A second exam on the same unit conflicts.
    res = client.post(
        f"/courses/{course_id}/units/{unit_ids[0]}/exam", json=exam_body, headers=owner
    )
    assert res.status_code == 409, res.text
    # A non-owner cannot create an exam.
    res = client.post(
        f"/courses/{course_id}/units/{unit_ids[0]}/exam", json=exam_body, headers=student
    )
    assert res.status_code == 403, res.text

    # The exam is locked until the unit's lessons are complete.
    res = client.get(f"/exams/{exam_id}", headers=student)
    assert res.status_code == 403, res.text
    res = client.post(f"/lessons/{lesson_ids[0]}/complete", headers=student)
    assert res.status_code == 200, res.text

    # GET returns questions without correct answers.
    res = client.get(f"/exams/{exam_id}", headers=student)
    assert res.status_code == 200, res.text
    assert "correct_answer" not in res.text
    assert "is_correct" not in res.text
    questions = res.json()["questions"]
    assert len(questions) == 2
    assert questions[0]["options"] == ["3", "4", "5"]

    # Fail first (1 of 2 = 50 < 70), then pass (2 of 2 = 100).
    res = client.post(
        f"/exams/{exam_id}/attempts",
        json={"answers": [{"question_id": questions[0]["id"], "answer": 0},
                          {"question_id": questions[1]["id"], "answer": "6"}]},
        headers=student,
    )
    assert res.status_code == 200, res.text
    assert res.json()["score"] == 50
    assert res.json()["passed"] is False
    assert res.json()["total"] == 2
    res = client.post(
        f"/exams/{exam_id}/attempts",
        json={"answers": [{"question_id": questions[0]["id"], "answer": 1},
                          {"question_id": questions[1]["id"], "answer": " 6 "}]},
        headers=student,
    )
    assert res.status_code == 200, res.text
    assert res.json()["score"] == 100
    assert res.json()["passed"] is True

    # Two attempts recorded, newest first, latest decides (passed).
    res = client.get(f"/exams/{exam_id}/attempts", headers=student)
    assert res.status_code == 200, res.text
    attempts = res.json()
    assert len(attempts) == 2
    assert attempts[0]["passed"] is True
    assert attempts[1]["passed"] is False
    res = client.get(f"/courses/{course_id}/exams", headers=student)
    assert res.json()[0]["status"] == "passed"

    # Final exam: 409 on a second one, and passing it completes the course.
    res = client.post(
        f"/courses/{course_id}/final-exam", json=exam_body, headers=owner
    )
    assert res.status_code == 200, res.text
    final_id = res.json()["id"]
    assert res.json()["is_final"] is True
    res = client.post(
        f"/courses/{course_id}/final-exam", json=exam_body, headers=owner
    )
    assert res.status_code == 409, res.text
    res = client.get(f"/courses/{course_id}/progress", headers=student)
    assert res.json()["course_complete"] is False  # final exam not yet passed
    final_qs = client.get(f"/exams/{final_id}", headers=student).json()["questions"]
    res = client.post(
        f"/exams/{final_id}/attempts",
        json={"answers": [{"question_id": final_qs[0]["id"], "answer": 1},
                          {"question_id": final_qs[1]["id"], "answer": "6"}]},
        headers=student,
    )
    assert res.json()["passed"] is True
    res = client.get(f"/courses/{course_id}/progress", headers=student)
    assert res.json()["course_complete"] is True
    assert res.json()["final_exam_status"] == "passed"


def test_star_eligibility_and_uniqueness(client):
    owner, _ = _auth_headers(client, "owner5@example.com")
    student, _ = _auth_headers(client, "student5@example.com")
    course_id, _, lesson_ids = _make_course(
        client, owner, "Star Course 5", units=1, lessons_per_unit=1, publish=True
    )

    # Not eligible before completing a unit.
    res = client.post(f"/courses/{course_id}/star", headers=student)
    assert res.status_code == 403, res.text
    res = client.get(f"/courses/{course_id}/star", headers=student)
    assert res.json() == {"starred": False}

    res = client.post(f"/lessons/{lesson_ids[0]}/complete", headers=student)
    assert res.status_code == 200, res.text
    res = client.post(f"/courses/{course_id}/star", headers=student)
    assert res.status_code == 200, res.text
    assert res.json()["starred"] is True
    res = client.get(f"/courses/{course_id}/star", headers=student)
    assert res.json() == {"starred": True}
    # One star per person: a second star conflicts.
    res = client.post(f"/courses/{course_id}/star", headers=student)
    assert res.status_code == 409, res.text
    res = client.get(f"/courses/{course_id}/stats")
    assert res.json()["stars"] == 1

    # One-star uniqueness holds at the DB level too.
    from sqlalchemy.exc import IntegrityError
    from database import SessionLocal
    from models import Star

    db = SessionLocal()
    try:
        db.add(Star(course_id=course_id, user_id=1))
        db.add(Star(course_id=course_id, user_id=1))
        db.flush()
        db.rollback()
        raise AssertionError("duplicate star insert should have failed")
    except IntegrityError:
        db.rollback()
    finally:
        db.close()


def test_view_counting_excludes_owner(client):
    owner, owner_body = _auth_headers(client, "owner6@example.com")
    other, _ = _auth_headers(client, "other6@example.com")
    course_id, _, _ = _make_course(client, owner, "View Course 6", publish=True)

    res = client.post(f"/courses/{course_id}/view")
    assert res.status_code == 200, res.text
    assert res.json() == {"views": 1}
    res = client.post(f"/courses/{course_id}/view")
    assert res.json() == {"views": 2}
    # Another logged-in user counts.
    res = client.post(f"/courses/{course_id}/view", headers=other)
    assert res.json() == {"views": 3}
    # The owner's views do not count.
    res = client.post(f"/courses/{course_id}/view", headers=owner)
    assert res.json() == {"views": 3}
    res = client.post(f"/courses/{course_id}/view", headers=owner)
    assert res.json() == {"views": 3}
    res = client.get(f"/courses/{course_id}/stats")
    assert res.json()["views"] == 3


def test_comments_and_profile(client):
    owner, _ = _auth_headers(client, "owner7@example.com")
    student, _ = _auth_headers(client, "student7@example.com")
    other, _ = _auth_headers(client, "other7@example.com")
    course_id, _, lesson_ids = _make_course(
        client, owner, "Comment Course 7", units=1, lessons_per_unit=1, publish=True
    )

    res = client.post(
        f"/courses/{course_id}/comments", json={"text": "Great course"}, headers=student
    )
    assert res.status_code == 200, res.text
    course_comment_id = res.json()["id"]
    res = client.post(
        f"/lessons/{lesson_ids[0]}/comments", json={"text": "Nice lesson"}, headers=student
    )
    assert res.status_code == 200, res.text
    lesson_comment_id = res.json()["id"]

    # Chronological order, newest last.
    res = client.get(f"/courses/{course_id}/comments")
    assert [c["text"] for c in res.json()] == ["Great course"]
    res = client.get(f"/lessons/{lesson_ids[0]}/comments")
    assert [c["text"] for c in res.json()] == ["Nice lesson"]
    # Anonymous users cannot post.
    res = client.post(f"/courses/{course_id}/comments", json={"text": "anon"})
    assert res.status_code == 401

    # A third user cannot delete someone else's comment; the course
    # owner can.
    res = client.delete(f"/comments/{course_comment_id}", headers=other)
    assert res.status_code == 403, res.text
    res = client.delete(f"/comments/{course_comment_id}", headers=owner)
    assert res.status_code == 200, res.text
    assert client.get(f"/courses/{course_id}/comments").json() == []
    # The author can delete their own.
    res = client.delete(f"/comments/{lesson_comment_id}", headers=student)
    assert res.status_code == 200, res.text

    # Profile update, and username uniqueness.
    res = client.put("/user", json={"first_name": "Stu", "bio": "learner"}, headers=student)
    assert res.status_code == 200, res.text
    assert res.json()["first_name"] == "Stu"
    assert res.json()["bio"] == "learner"
    res = client.put("/user", json={"username": "owner7"}, headers=student)
    assert res.status_code == 409, res.text


def test_teaching_students_and_progress_views(client):
    owner, _ = _auth_headers(client, "owner8@example.com")
    student, _ = _auth_headers(client, "student8@example.com")
    course_id, unit_ids, lesson_ids = _make_course(
        client, owner, "Roster Course 8", units=2, lessons_per_unit=1, publish=True
    )

    res = client.post(f"/courses/{course_id}/enroll", headers=student)
    assert res.status_code == 200, res.text
    res = client.post(f"/lessons/{lesson_ids[0]}/complete", headers=student)
    assert res.status_code == 200, res.text

    # The student sees their own progress, with the second unit unlocked.
    res = client.get(f"/courses/{course_id}/progress", headers=student)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["completed_lessons"] == 1
    assert body["total_lessons"] == 2
    assert body["progress"] == 50
    assert body["units"][0]["complete"] is True
    assert body["units"][0]["locked"] is False
    assert body["units"][1]["complete"] is False
    assert body["units"][1]["locked"] is False
    assert body["course_complete"] is False

    # The teacher roster shows the student's history; a non-owner may
    # not see it.
    res = client.get(f"/courses/{course_id}/students", headers=student)
    assert res.status_code == 403, res.text
    res = client.get(f"/courses/{course_id}/students", headers=owner)
    assert res.status_code == 200, res.text
    roster = res.json()
    assert len(roster) == 1
    assert roster[0]["email"] == "student8@example.com"
    assert roster[0]["lessons_completed"] == 1
    assert roster[0]["total_lessons"] == 2
    assert roster[0]["progress"] == 50
    assert roster[0]["units"][0]["complete"] is True
    assert roster[0]["units"][1]["complete"] is False

    # Course list sorting by stars: starred courses come first.
    res = client.post(f"/courses/{course_id}/star", headers=student)
    assert res.status_code == 200, res.text
    res = client.get("/courses/?sort=stars")
    assert res.status_code == 200, res.text
    listed = res.json()
    assert listed[0]["stars"] == 1
    mine = [c for c in listed if c["id"] == course_id]
    assert len(mine) == 1 and mine[0]["stars"] == 1
    assert all(c["stars"] <= 1 for c in listed)
