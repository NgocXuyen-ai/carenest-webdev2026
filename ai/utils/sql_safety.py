import re


_DANGEROUS_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXEC|EXECUTE|MERGE)\b",
    re.IGNORECASE,
)

_SENSITIVE_COLUMNS = re.compile(
    r"\b(password_hash|password|secret|token|api_key)\b",
    re.IGNORECASE,
)


def validate_sql(sql: str) -> tuple[bool, str]:
    """
    Validate that a generated SQL string is safe to execute.
    Returns (is_safe, error_message).
    """
    stripped = sql.strip()

    if not stripped:
        return False, "SQL rỗng"

    # Block multiple statements (SQL injection via semicolon)
    # Allow a trailing semicolon but not midway ones
    without_trailing = stripped.rstrip(";")
    if ";" in without_trailing:
        return False, "Không cho phép nhiều câu lệnh SQL trong một request"

    # Must start with SELECT
    if not re.match(r"^\s*SELECT\b", stripped, re.IGNORECASE):
        return False, "Chỉ cho phép câu lệnh SELECT"

    # Block dangerous keywords
    match = _DANGEROUS_KEYWORDS.search(stripped)
    if match:
        return False, f"Từ khóa không được phép: {match.group().upper()}"

    # Block sensitive column names
    match = _SENSITIVE_COLUMNS.search(stripped)
    if match:
        return False, f"Không được truy vấn trường nhạy cảm: {match.group()}"

    return True, ""
