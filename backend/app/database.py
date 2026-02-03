from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Attempt to load .env if python-dotenv is installed. If not installed,
# continue without failing — instruct the developer to install it.
try:
    from dotenv import load_dotenv

    # load .env from backend directory if present
    load_dotenv()
except Exception:
    # dotenv not available; environment variables must be provided by the environment
    pass

# Prefer a full DATABASE_URL if provided, otherwise build from components
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "password")
    db_name = os.getenv("DB_NAME", "blog_db")
    DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

def get_db_connection():
    """Create and return database engine using DATABASE_URL."""
    return create_engine(DATABASE_URL)


engine = get_db_connection()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()