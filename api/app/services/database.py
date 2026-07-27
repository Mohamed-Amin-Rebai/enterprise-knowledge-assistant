from sqlalchemy import create_engine, text
from ..config import settings

engine = (
    create_engine(settings.database_url, pool_pre_ping=True)
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
