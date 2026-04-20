import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from config import settings
from rate_limiter import limiter
from schemas.ocr_schemas import OcrRequest, OcrResponse
from services.ocr_service import process_ocr
from utils.trace import emit_trace, new_trace_id
from utils.internal_auth import verify_internal_request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal", tags=["ocr"], dependencies=[Depends(verify_internal_request)])


@router.post("/ocr", response_model=OcrResponse)
@limiter.limit(settings.RATE_LIMIT_OCR)
def ocr(body: OcrRequest, request: Request) -> OcrResponse:
    trace_id = new_trace_id("api-ocr")
    emit_trace(
        logger,
        "api.ocr.start",
        trace_id=trace_id,
        user_id=body.user_id,
        profile_id=body.profile_id,
        image_base64_size=len(body.image_base64 or ""),
    )
    try:
        response = process_ocr(body)
        emit_trace(
            logger,
            "api.ocr.done",
            trace_id=trace_id,
            ocr_id=response.ocr_id,
            medicine_count=len(response.structured_data.medicines),
            raw_text_length=len(response.raw_text),
        )
        return response
    except Exception as e:
        emit_trace(logger, "api.ocr.error", trace_id=trace_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
