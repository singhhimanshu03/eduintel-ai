from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class RecommendationRequest(BaseModel):
    student_id: str
    attendance_percentage: float = Field(..., ge=0.0, le=100.0)
    avg_internal_marks: float = Field(..., ge=0.0, le=100.0)
    prev_semester_gpa: float = Field(..., ge=0.0, le=10.0)
    current_gpa: float = Field(..., ge=0.0, le=10.0)
    fee_status: str = Field(..., description="'paid' | 'partially_paid' | 'unpaid'")
    backlog_count: int = Field(..., ge=0)
    internal_marks: List[float] = Field(..., description="List of internal marks per subject")
    attendance_trend: Optional[List[float]] = Field(
        default=None,
        description="Attendance % per semester (last 3). Defaults to current attendance repeated."
    )
    performance_trend: Optional[List[float]] = Field(
        default=None,
        description="GPA per semester (last 3). Defaults to prev_semester_gpa repeated."
    )
    fee_paid_ratio: Optional[float] = Field(
        default=1.0,
        ge=0.0, le=1.0,
        description="Fraction of past semesters where fee was fully paid."
    )


class AttendanceTarget(BaseModel):
    current_marks: float
    target: float


class RecommendationResponse(BaseModel):
    student_id: str
    subjects_needing_attention: List[str]
    attendance_targets: Dict[str, AttendanceTarget]
    improvement_plan: List[str]
    overall_risk: str  # "Low" | "Medium" | "High"
