from decimal import Decimal
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError

from config import settings


def _build_connect_args(database_url: str, statement_timeout_ms: int) -> dict[str, str]:
    """Build driver connect args compatible with the target PostgreSQL endpoint.

    Neon pooled endpoints reject startup options (e.g. statement_timeout in options).
    """
    try:
        host = (make_url(database_url).host or "").lower()
    except Exception:
        host = ""

    is_neon_pooler = "neon.tech" in host and "pooler" in host
    if is_neon_pooler:
        return {}

    return {"options": f"-c statement_timeout={statement_timeout_ms}"}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=_build_connect_args(settings.DATABASE_URL, settings.DB_STATEMENT_TIMEOUT_MS),
)


def execute_write(sql: str, params: dict = None):
    """Execute a write SQL statement (INSERT/UPDATE) with auto-commit."""
    with engine.begin() as conn:
        result = conn.execute(text(sql), params or {})
        return result


def execute_query(sql: str, params: dict = None) -> list[dict[str, Any]]:
    """Execute a read-only SQL query and return a list of serializable dicts."""
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        rows = []
        for row in result.mappings():
            row_dict = {}
            for key, val in dict(row).items():
                if val is None:
                    row_dict[key] = None
                elif hasattr(val, "isoformat"):
                    row_dict[key] = val.isoformat()
                elif isinstance(val, Decimal):
                    row_dict[key] = float(val)
                else:
                    row_dict[key] = val
            rows.append(row_dict)
        return rows
