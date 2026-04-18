from decimal import Decimal
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={
        "options": f"-c statement_timeout={settings.DB_STATEMENT_TIMEOUT_MS}"
    },
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
