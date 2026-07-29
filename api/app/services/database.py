from sqlalchemy import create_engine, text
from sqlalchemy.pool import QueuePool
from ..config import settings

engine = (
    create_engine(
        settings.database_url,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_pre_ping=True,  # Check connections before using
        pool_recycle=3600
    )
    if settings.database_url
    else None
)


def db_ready() -> bool:
    return engine is not None


def query(sql: str, params=None):
    params = params or {}
    if not engine:
        return []
    with engine.begin() as conn:
        return conn.execute(text(sql), params).mappings().all()
