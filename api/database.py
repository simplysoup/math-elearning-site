import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# No default: the database URL is a secret and must come from the
# environment (compose sets it with host "db"; local runs use
# api/.env or an exported DATABASE_URL). Failing fast here beats
# silently connecting to the wrong database with a known password.
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy api/.env.example to api/.env "
        "and fill it in, or set DATABASE_URL in the environment."
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