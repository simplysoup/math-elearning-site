import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# In Docker Compose the api service sets DATABASE_URL with host "db".
# Outside Docker (local run) default to localhost so the same code works.
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "***REMOVED***"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()