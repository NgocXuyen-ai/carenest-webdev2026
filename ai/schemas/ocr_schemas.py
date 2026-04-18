from typing import Optional, List

from pydantic import BaseModel


class OcrRequest(BaseModel):
    user_id: int
    profile_id: int
    image_base64: str


class MedicineItem(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[int] = None
    duration: Optional[str] = None
    note: Optional[str] = None


class OcrStructuredData(BaseModel):
    medicines: List[MedicineItem] = []
    doctor_name: Optional[str] = None
    clinic_name: Optional[str] = None
    date: Optional[str] = None


class OcrResponse(BaseModel):
    raw_text: str
    structured_data: OcrStructuredData
    ocr_id: Optional[int] = None
