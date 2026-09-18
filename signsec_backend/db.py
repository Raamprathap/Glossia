from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker, DeclarativeBase

from .config import Settings


class Base(DeclarativeBase):
    pass


SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False))


def init_db(app, settings: Settings) -> None:
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    SessionLocal.configure(bind=engine)
    app.extensions["db_engine"] = engine


def get_db_session():
    """
    Use inside request handlers.
    """
    return SessionLocal()


