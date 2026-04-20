import json
from typing import Any, Optional
from uuid import uuid4

from config import settings


def new_trace_id(prefix: str = "ai") -> str:
    return f"{prefix}-{uuid4().hex[:8]}"


def preview_text(text: Any, limit: Optional[int] = None) -> str:
    if text is None:
        return ""

    value = str(text)
    max_chars = limit if isinstance(limit, int) and limit > 0 else settings.AI_TRACE_MAX_PREVIEW_CHARS
    max_chars = max(80, max_chars)
    if len(value) <= max_chars:
        return value
    return value[:max_chars] + " ...(truncated)"


def _serialize_payload_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (int, float, bool)):
        return value
    if isinstance(value, str):
        return preview_text(value)
    if isinstance(value, (dict, list, tuple, set)):
        try:
            encoded = json.dumps(value, ensure_ascii=False, default=str)
        except Exception:
            encoded = str(value)
        return preview_text(encoded)
    return preview_text(str(value))


def emit_trace(logger: Any, stage: str, *, trace_id: Optional[str] = None, prefix: str = "AI_TRACE", **payload: Any) -> None:
    if not settings.AI_TRACE_ENABLED:
        return

    normalized_payload = {
        key: _serialize_payload_value(value)
        for key, value in payload.items()
    }
    encoded_payload = json.dumps(normalized_payload, ensure_ascii=False, default=str)
    line = f"[{prefix}] trace_id={trace_id or 'n/a'} stage={stage} payload={encoded_payload}"
    logger.info(line)
    if settings.AI_TRACE_PRINT_STDOUT:
        print(line, flush=True)
