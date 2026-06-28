from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class PerformanceRequest(BaseModel):
    student_id: str
    internal_marks: List[float]
    attendance_percentage: float = Field(..., ge=0, le=100)
    prev_semester_gpa: float = Field(..., ge=0, le=10)
    backlog_count: int = Field(..., ge=0)


class PerformanceBatchRequest(BaseModel):
    students: List[PerformanceRequest]


class PerformanceResponse(BaseModel):
    student_id: str
    predicted_gpa_lower: float
    predicted_gpa_upper: float
    backlog_probability: Dict[str, float]   # subject_index -> probability
    flagged_subjects: List[str]
    model_version: Optional[str] = None
