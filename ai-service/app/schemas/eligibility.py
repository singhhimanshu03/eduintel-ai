from pydantic import BaseModel, Field
from typing import List, Optional


class EligibilityRequest(BaseModel):
    student_id: str
    attendance_percentage: float = Field(..., ge=0, le=100)
    fee_status: str = Field(..., pattern="^(paid|unpaid|partially_paid)$")
    avg_internal_marks: float = Field(..., ge=0)
    prev_semester_gpa: float = Field(..., ge=0, le=10)


class EligibilityBatchRequest(BaseModel):
    students: List[EligibilityRequest]


class EligibilityResponse(BaseModel):
    student_id: str
    risk_score: str           # Low | Medium | High
    confidence: float
    feature_importance: dict
    model_version: Optional[str] = None
