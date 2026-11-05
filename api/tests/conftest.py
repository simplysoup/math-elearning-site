import os
import sys

# Test database: a throwaway SQLite file, created before the app imports
# its database module (DATABASE_URL is read at import time).
os.environ["DATABASE_URL"] = "sqlite:////tmp/mes-ci-test.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-ci-only"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from models import Base  # noqa: E402
from database import engine  # noqa: E402
from seed import seed  # noqa: E402


@pytest.fixture(scope="module")
def client():
    if os.path.exists("/tmp/mes-ci-test.db"):
        os.remove("/tmp/mes-ci-test.db")
    Base.metadata.create_all(bind=engine)
    seed()
    from main import app

    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)
