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
    res = client.post("/courses/", params={"title": "Nope", "description": "no auth"})
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
        params={"title": "Editor Course", "description": "made in a test"},
        headers=headers,
    )
    assert res.status_code == 200, res.text
    course_id = res.json()["id"]
    res = client.post(
        f"/courses/{course_id}/chapters/",
        params={"title": "Chapter One"},
        headers=headers,
    )
    assert res.status_code == 200, res.text
    chapter_id = res.json()["id"]
    res = client.post(
        f"/chapters/{chapter_id}/lessons/",
        params={"title": "Lesson One"},
        headers=headers,
    )
    assert res.status_code == 200, res.text
    lesson_id = res.json()["id"]

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
