import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from rate_limiter import limiter
from routers import chat, conversation, ocr, voice


def _configure_logging() -> None:
    level_name = (settings.AI_LOG_LEVEL or "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        force=True,
    )


_configure_logging()

app = FastAPI(title="CareNest AI Service", version="1.0.0")

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Bạn gửi yêu cầu quá nhanh. Vui lòng đợi một chút rồi thử lại."},
    )


app.include_router(chat.router)
app.include_router(ocr.router)
app.include_router(voice.router)
app.include_router(conversation.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "carenest-ai"}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "carenest-ai"}
