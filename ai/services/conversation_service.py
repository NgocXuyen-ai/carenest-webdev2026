"""
Conversation service: CRUD operations for ai_conversation, ai_chat_detail, ai_request_log.
All write operations use execute_write (auto-commit via engine.begin()).
"""
import json
import logging
from datetime import datetime
from typing import Optional

from database import execute_query, execute_write

logger = logging.getLogger(__name__)


# ─── Conversation ────────────────────────────────────────────────────────────

def create_conversation(user_id: int, title: str) -> int:
    """Create a new conversation and return its ID."""
    result = execute_write(
        """
        INSERT INTO ai_conversation (user_id, title, status, created_at, updated_at)
        VALUES (:user_id, :title, 'ACTIVE', NOW(), NOW())
        RETURNING conversation_id
        """,
        {"user_id": user_id, "title": title[:255]},
    )
    row = result.fetchone()
    return row[0]


def get_conversation(conversation_id: int, user_id: int) -> Optional[dict]:
    """
    Fetch a conversation by ID, verifying user ownership.
    Returns None if not found or wrong user.
    """
    rows = execute_query(
        """
        SELECT conversation_id, user_id, title, status, created_at, updated_at
        FROM ai_conversation
        WHERE conversation_id = :cid AND user_id = :uid
        """,
        {"cid": conversation_id, "uid": user_id},
    )
    return rows[0] if rows else None


def close_conversation(conversation_id: int) -> None:
    """Set conversation status to 'closed'."""
    execute_write(
        "UPDATE ai_conversation SET status='CLOSED', updated_at=NOW() WHERE conversation_id = :cid",
        {"cid": conversation_id},
    )


def touch_conversation(conversation_id: int) -> None:
    """Update updated_at to now (tracks last activity for expiry checks)."""
    execute_write(
        "UPDATE ai_conversation SET updated_at=NOW() WHERE conversation_id = :cid",
        {"cid": conversation_id},
    )


def list_conversations(
    user_id: int,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """
    List conversations for a user ordered by most recent activity.
    Returns (conversations, total_count).
    """
    rows = execute_query(
        """
        SELECT
            c.conversation_id,
            c.title,
            c.status,
            c.created_at,
            c.updated_at,
            COUNT(d.message_id) AS message_count
        FROM ai_conversation c
        LEFT JOIN ai_chat_detail d ON c.conversation_id = d.conversation_id
        WHERE c.user_id = :uid
        GROUP BY c.conversation_id
        ORDER BY c.updated_at DESC
        LIMIT :lim OFFSET :off
        """,
        {"uid": user_id, "lim": limit, "off": offset},
    )

    total_rows = execute_query(
        "SELECT COUNT(*) AS total FROM ai_conversation WHERE user_id = :uid",
        {"uid": user_id},
    )
    total = total_rows[0]["total"] if total_rows else 0

    return rows, total


# ─── Messages ─────────────────────────────────────────────────────────────────

def save_message(
    conversation_id: int,
    request_id: Optional[int],
    sender: str,
    message_type: str,
    content: str,
) -> int:
    """
    Persist a message to ai_chat_detail.
    sender:       "user" | "assistant"
    message_type: "text" | "sql_query" | "error"
    Returns the new message_id.
    """
    result = execute_write(
        """
        INSERT INTO ai_chat_detail
            (conversation_id, request_id, sender, message_type, content, sent_at)
        VALUES (:cid, :rid, :sender, :mtype, :content, NOW())
        RETURNING message_id
        """,
        {
            "cid": conversation_id,
            "rid": request_id,
            "sender": sender,
            "mtype": message_type,
            "content": content,
        },
    )
    row = result.fetchone()
    return row[0]


def get_recent_history(conversation_id: int, limit: int = 10) -> list[dict]:
    """
    Fetch the last `limit` messages for a conversation, ordered oldest-first.
    Each dict has: message_id, sender, message_type, content, sent_at
    """
    rows = execute_query(
        """
        SELECT message_id, sender, message_type, content, sent_at
        FROM ai_chat_detail
        WHERE conversation_id = :cid
        ORDER BY sent_at DESC
        LIMIT :lim
        """,
        {"cid": conversation_id, "lim": limit},
    )
    # Reverse to get chronological order
    return list(reversed(rows))


def get_conversation_messages(conversation_id: int, user_id: int) -> list[dict]:
    """
    Fetch ALL messages for a conversation (with ownership check).
    Returns empty list if conversation doesn't belong to user.
    """
    rows = execute_query(
        """
        SELECT d.message_id, d.sender, d.message_type, d.content, d.sent_at
        FROM ai_chat_detail d
        JOIN ai_conversation c ON d.conversation_id = c.conversation_id
        WHERE d.conversation_id = :cid AND c.user_id = :uid
        ORDER BY d.sent_at ASC
        """,
        {"cid": conversation_id, "uid": user_id},
    )
    return rows


# ─── Request log ──────────────────────────────────────────────────────────────

def save_request_log(
    feature_type: str,
    output_raw: str,
    status: str,
    provider: str,
    execution_time: Optional[float] = None,
    total_tokens: Optional[int] = None,
    error_message: Optional[str] = None,
) -> Optional[int]:
    """
    Persist an AI request log entry. Returns request_id or None on failure.
    """
    try:
        result = execute_write(
            """
            INSERT INTO ai_request_log
                (feature_type, input_prompt, output_raw, status, error_message,
                 total_tokens, execution_time, provider, created_at)
            VALUES
                (:ftype, :input, :out, :status, :err,
                 :tokens, :etime, :provider, NOW())
            RETURNING request_id
            """,
            {
                "ftype": _normalize_feature_type(feature_type),
                "input": "",
                "out": output_raw[:1000] if output_raw else "",
                "status": _normalize_status(status),
                "err": error_message,
                "tokens": total_tokens,
                "etime": execution_time,
                "provider": _normalize_provider(provider),
            },
        )
        row = result.fetchone()
        return row[0]
    except Exception as e:
        logger.error(f"Failed to save request log: {e}")
        return None


# ─── OCR Session ──────────────────────────────────────────────────────────────

def save_ocr_session(
    profile_id: int,
    request_id: Optional[int],
    raw_text: str,
    structure_data: Optional[dict],
    prompt_request: str,
    status: str,
    image_url: Optional[str] = None,
) -> Optional[int]:
    """
    Persist an OCR session to ocr_session table. Returns ocr_id or None on failure.
    """
    try:
        result = execute_write(
            """
            INSERT INTO ocr_session
                (profile_id, request_id, image_url, raw_text, structure_data, prompt_request, status)
            VALUES
                (:pid, :rid, :img_url, :raw, :sdata, :prompt, :status)
            RETURNING ocr_id
            """,
            {
                "pid": profile_id,
                "rid": request_id,
                "img_url": image_url,
                "raw": raw_text,
                "sdata": json.dumps(structure_data, ensure_ascii=False) if structure_data else None,
                "prompt": prompt_request[:1000] if prompt_request else "",
                "status": _normalize_ocr_status(status),
            },
        )
        row = result.fetchone()
        return row[0]
    except Exception as e:
        logger.error(f"Failed to save OCR session: {e}")
        return None


def _normalize_feature_type(feature_type: str) -> str:
    normalized = (feature_type or "").strip().upper()
    mapping = {
        "CHAT": "CHAT",
        "OCR": "OCR",
        "SUMMARY": "SUMMARY",
        "HEALTH_ANALYSIS": "HEALTH_ANALYSIS",
        "RECOMMENDATION": "RECOMMENDATION",
    }
    return mapping.get(normalized, "CHAT")


def _normalize_status(status: str) -> str:
    normalized = (status or "").strip().upper()
    if normalized in {"SUCCESS", "COMPLETED"}:
        return "SUCCESS"
    if normalized in {"FAILED", "ERROR"}:
        return "FAILED"
    return "PENDING"


def _normalize_provider(provider: str) -> str:
    raw = (provider or "").strip().lower()
    if "claude" in raw:
        return "CLAUDE"
    if "gpt" in raw or "openai" in raw:
        return "OPENAI"
    if "gemini" in raw:
        return "GEMINI"
    return "OTHER"


def _normalize_ocr_status(status: str) -> str:
    normalized = (status or "").strip().upper()
    if normalized in {"SUCCESS", "COMPLETED"}:
        return "COMPLETED"
    if normalized in {"FAILED", "ERROR"}:
        return "FAILED"
    return "PROCESSING"
