import json
import logging
import re
import time
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

from config import settings
from prompts.ocr_prompt import OCR_SYSTEM_PROMPT
from schemas.ocr_schemas import MedicineItem, OcrRequest, OcrResponse, OcrStructuredData
from services import conversation_service
from utils.image_utils import decode_base64_image, encode_to_base64, get_media_type, resize_image

logger = logging.getLogger(__name__)

_llm_vision: Optional[ChatAnthropic] = None


def _get_llm_vision() -> ChatAnthropic:
    global _llm_vision
    if _llm_vision is None:
        _llm_vision = ChatAnthropic(
            model=settings.OCR_MODEL,
            anthropic_api_url=settings.PROXY_BASE_URL,
            anthropic_api_key=settings.PROXY_API_KEY,
            max_tokens=4096,
            timeout=settings.LLM_TIMEOUT,
            max_retries=settings.LLM_MAX_RETRIES,
        )
    return _llm_vision


def _parse_ocr_response(raw: str) -> OcrStructuredData:
    """Parse JSON from LLM response into OcrStructuredData."""
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return OcrStructuredData(medicines=[])
    try:
        data = json.loads(match.group())
        medicines = [MedicineItem(**m) for m in data.get("medicines", [])]
        return OcrStructuredData(
            medicines=medicines,
            doctor_name=data.get("doctor_name"),
            clinic_name=data.get("clinic_name"),
            date=data.get("date"),
        )
    except (json.JSONDecodeError, TypeError, ValueError):
        return OcrStructuredData(medicines=[])


def process_ocr(request: OcrRequest) -> OcrResponse:
    start_time = time.time()
    llm = _get_llm_vision()

    # Preprocess image
    image_bytes = decode_base64_image(request.image_base64)
    image_bytes = resize_image(image_bytes)
    media_type = get_media_type(image_bytes)
    image_b64 = encode_to_base64(image_bytes)

    message = HumanMessage(content=[
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": image_b64,
            },
        },
        {
            "type": "text",
            "text": OCR_SYSTEM_PROMPT,
        },
    ])

    try:
        response = llm.invoke([message])
        raw_text = response.content
    except Exception as e:
        logger.error(f"OCR LLM call failed: {e}")
        execution_time = time.time() - start_time
        request_id = conversation_service.save_request_log(
            feature_type="ocr",
            output_raw="",
            status="FAILED",
            provider=settings.OCR_MODEL,
            execution_time=execution_time,
            error_message=str(e),
        )
        conversation_service.save_ocr_session(
            profile_id=request.profile_id,
            request_id=request_id,
            raw_text="",
            structure_data=None,
            prompt_request=OCR_SYSTEM_PROMPT,
            status="FAILED",
        )
        raise RuntimeError("Không thể phân tích hình ảnh. Vui lòng thử lại.")

    structured = _parse_ocr_response(raw_text)
    execution_time = time.time() - start_time

    request_id = conversation_service.save_request_log(
        feature_type="ocr",
        output_raw=raw_text,
        status="SUCCESS",
        provider=settings.OCR_MODEL,
        execution_time=execution_time,
    )

    ocr_id = conversation_service.save_ocr_session(
        profile_id=request.profile_id,
        request_id=request_id,
        raw_text=raw_text,
        structure_data=structured.model_dump(),
        prompt_request=OCR_SYSTEM_PROMPT,
        status="COMPLETED",
    )

    return OcrResponse(
        raw_text=raw_text,
        structured_data=structured,
        ocr_id=ocr_id,
    )
