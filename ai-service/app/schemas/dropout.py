from pydantic import BaseModel, Field
from typing import List, Optional


class DropoutRequest(BaseModel):
    student_id: str
    attendance_trend: List[float]   # last 3 semesters attendance %
    performance_trend: List[float]  # last 3 semesters GPA
    fee_paid_ratio: float = Field(..., ge=0, le=1)
    current_gpa: float = Field(..., ge=0, le=10)


class DropoutResponse(BaseModel):
    student_id: str
    dropout_probability: float
    risk_score: str
    risk_factors: List[str]
    model_version: Optional[str] = None
