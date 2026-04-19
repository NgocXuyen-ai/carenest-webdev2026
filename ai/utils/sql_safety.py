import re


_DANGEROUS_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXEC|EXECUTE|MERGE)\b",
    re.IGNORECASE,
)

_READ_LOCK_KEYWORDS = re.compile(r"\bFOR\s+UPDATE\b", re.IGNORECASE)

_SENSITIVE_COLUMNS = re.compile(
    r"\b(password_hash|password|secret|token|api_key)\b",
    re.IGNORECASE,
)

_TENANT_VALUE = r"(?:\d+|:\w+|\{\{?\w+\}?\}|%\(\w+\)s)"
_TENANT_MATCH = rf"(?:=\s*{_TENANT_VALUE}|IN\s*\([^\)]*{_TENANT_VALUE}[^\)]*\)|=\s*ANY\s*\([^\)]*{_TENANT_VALUE}[^\)]*\))"

_TENANT_SCOPE_PATTERNS = [
    re.compile(rf"\b(?:health_profile|hp|\w+)\.user_id\s*{_TENANT_MATCH}", re.IGNORECASE),
    re.compile(rf"\buser_id\s*{_TENANT_MATCH}", re.IGNORECASE),
    re.compile(rf"\b(?:families|f|\w+)\.owner\s*{_TENANT_MATCH}", re.IGNORECASE),
    re.compile(rf"\bowner\s*{_TENANT_MATCH}", re.IGNORECASE),
]


def validate_sql(sql: str) -> tuple[bool, str]:
    """Validate that a generated SQL string is safe and tenant-scoped."""
    stripped = sql.strip()

    if not stripped:
        return False, "SQL rong"

    without_trailing = stripped.rstrip(";")
    if ";" in without_trailing:
        return False, "Không cho phep nhieu cau lenh SQL trong mot request"

    if not re.match(r"^\s*(SELECT|WITH)\b", stripped, re.IGNORECASE):
        return False, "Chỉ cho phép truy vấn chỉ đọc (SELECT hoặc WITH ... SELECT)"

    match = _DANGEROUS_KEYWORDS.search(stripped)
    if match:
        return False, f"Từ khóa không được phép: {match.group().upper()}"

    match = _READ_LOCK_KEYWORDS.search(stripped)
    if match:
        return False, "Không cho phép truy vấn khóa bản ghi (FOR UPDATE)"

    match = _SENSITIVE_COLUMNS.search(stripped)
    if match:
        return False, f"Không được truy vấn trường nhạy cảm: {match.group()}"

    if not any(pattern.search(stripped) for pattern in _TENANT_SCOPE_PATTERNS):
        return False, (
            "Query thiếu điều kiện giới hạn tenant "
            "(ví dụ health_profile.user_id = <user_id> hoặc families.owner = <user_id>)"
        )

    return True, ""

