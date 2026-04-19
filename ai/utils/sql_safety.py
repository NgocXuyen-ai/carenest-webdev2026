import re


_DANGEROUS_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXEC|EXECUTE|MERGE)\b",
    re.IGNORECASE,
)

_SENSITIVE_COLUMNS = re.compile(
    r"\b(password_hash|password|secret|token|api_key)\b",
    re.IGNORECASE,
)

_HEALTH_PROFILE_TABLE = re.compile(r"\bhealth_profile\b", re.IGNORECASE)
_TENANT_FILTER = re.compile(
    r"\b(?:health_profile|hp)\.user_id\b|\buser_id\b",
    re.IGNORECASE,
)


def validate_sql(sql: str) -> tuple[bool, str]:
    """Validate that a generated SQL string is safe and tenant-scoped."""
    stripped = sql.strip()

    if not stripped:
        return False, "SQL rong"

    without_trailing = stripped.rstrip(";")
    if ";" in without_trailing:
        return False, "Không cho phep nhieu cau lenh SQL trong mot request"

    if not re.match(r"^\s*SELECT\b", stripped, re.IGNORECASE):
        return False, "Chi cho phep cau lenh SELECT"

    match = _DANGEROUS_KEYWORDS.search(stripped)
    if match:
        return False, f"Từ khóa không được phép: {match.group().upper()}"

    match = _SENSITIVE_COLUMNS.search(stripped)
    if match:
        return False, f"Không được truy vấn trường nhạy cảm: {match.group()}"

    if not _HEALTH_PROFILE_TABLE.search(stripped):
        return False, "Query phải join hoặc truy vấn bảng health_profile để giới hạn tenant"

    if not _TENANT_FILTER.search(stripped):
        return False, "Query thieu dieu kien loc tenant theo health_profile.user_id"

    return True, ""

