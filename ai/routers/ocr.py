from fastapi import APIRouter, Depends, HTTPException, Request

from config import settings
from rate_limiter import limiter
from schemas.ocr_schemas import OcrRequest, OcrResponse
from services.ocr_service import process_ocr
from utils.internal_auth import verify_internal_request

router = APIRouter(prefix="/internal", tags=["ocr"], dependencies=[Depends(verify_internal_request)])


@router.post("/ocr", response_model=OcrResponse)
@limiter.limit(settings.RATE_LIMIT_OCR)
def ocr(body: OcrRequest, request: Request) -> OcrResponse:
    try:
        return process_ocr(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
