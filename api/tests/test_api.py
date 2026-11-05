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
