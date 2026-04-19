from fastapi import Header, HTTPException

from config import settings


def verify_internal_request(x_internal_token: str = Header(..., alias="X-Internal-Token")) -> None:
    if not settings.INTERNAL_SHARED_TOKEN:
        raise HTTPException(status_code=500, detail="AI internal token is not configured")

    if x_internal_token != settings.INTERNAL_SHARED_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden")
