import json
import logging
import re
import time
from typing import Any, Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

from config import settings
from prompts.ocr_prompt import OCR_SYSTEM_PROMPT
from schemas.ocr_schemas import MedicineItem, OcrRequest, OcrResponse, OcrStructuredData
from services import conversation_service
from utils.trace import emit_trace, new_trace_id, preview_text
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


def _content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
                continue
            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
                    continue

            text_attr = getattr(item, "text", None)
            if isinstance(text_attr, str):
                parts.append(text_attr)
        return "\n".join(parts).strip()

    return str(content).strip()


def _parse_ocr_response(raw: str, trace_id: Optional[str] = None) -> OcrStructuredData:
    """Parse JSON from LLM response into OcrStructuredData."""
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        emit_trace(
            logger,
            "ocr.parse.no_json_object",
            trace_id=trace_id,
            raw_preview=preview_text(raw, 300),
        )
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
        emit_trace(
            logger,
            "ocr.parse.invalid_json",
            trace_id=trace_id,
            raw_preview=preview_text(raw, 300),
        )
        return OcrStructuredData(medicines=[])


def process_ocr(request: OcrRequest) -> OcrResponse:
    start_time = time.time()
    trace_id = new_trace_id("ocr")
    emit_trace(
        logger,
        "ocr.process.start",
        trace_id=trace_id,
        user_id=request.user_id,
        profile_id=request.profile_id,
        image_base64_size=len(request.image_base64 or ""),
    )

    llm = _get_llm_vision()

    # Preprocess image
    preprocess_start = time.time()
    image_bytes = decode_base64_image(request.image_base64)
    original_bytes_size = len(image_bytes)
    image_bytes = resize_image(image_bytes)
    resized_bytes_size = len(image_bytes)
    media_type = get_media_type(image_bytes)
    image_b64 = encode_to_base64(image_bytes)
    emit_trace(
        logger,
        "ocr.preprocess.done",
        trace_id=trace_id,
        media_type=media_type,
        original_bytes_size=original_bytes_size,
        resized_bytes_size=resized_bytes_size,
        preprocess_elapsed_ms=round((time.time() - preprocess_start) * 1000, 2),
    )

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
        invoke_start = time.time()
        response = llm.invoke([message])
        raw_text = _content_to_text(response.content)
        emit_trace(
            logger,
            "ocr.llm.success",
            trace_id=trace_id,
            model=settings.OCR_MODEL,
            raw_text_preview=preview_text(raw_text),
            llm_elapsed_ms=round((time.time() - invoke_start) * 1000, 2),
        )
    except Exception as e:
        logger.error(f"OCR LLM call failed: {e}")
        emit_trace(
            logger,
            "ocr.llm.error",
            trace_id=trace_id,
            error=str(e),
        )
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
        emit_trace(
            logger,
            "ocr.persist.failed",
            trace_id=trace_id,
            request_id=request_id,
            execution_time_ms=round(execution_time * 1000, 2),
        )
        raise RuntimeError("Không thể phân tích hình ảnh. Vui lòng thử lại.")

    structured = _parse_ocr_response(raw_text, trace_id=trace_id)
    emit_trace(
        logger,
        "ocr.parse.done",
        trace_id=trace_id,
        medicine_count=len(structured.medicines),
        doctor_name=structured.doctor_name,
        clinic_name=structured.clinic_name,
        date=structured.date,
    )

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

    emit_trace(
        logger,
        "ocr.process.done",
        trace_id=trace_id,
        request_id=request_id,
        ocr_id=ocr_id,
        status="SUCCESS",
        execution_time_ms=round(execution_time * 1000, 2),
        raw_text_preview=preview_text(raw_text),
    )

    return OcrResponse(
        raw_text=raw_text,
        structured_data=structured,
        ocr_id=ocr_id,
    )
