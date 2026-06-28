from pydantic import BaseModel, Field
from typing import List, Optional


class ReadinessRequest(BaseModel):
    student_id: str
    cgpa: float = Field(..., ge=0.0, le=10.0, description="Cumulative GPA on 10-point scale")
    backlog_count: int = Field(..., ge=0, description="Number of active backlogs")
    skill_count: int = Field(..., ge=0, description="Number of skills in profile")
    mock_interview_score: float = Field(default=0.0, ge=0.0, le=100.0,
                                         description="Mock interview score out of 100")


class ReadinessBreakdown(BaseModel):
    gpa_contribution: float
    skill_contribution: float
    interview_contribution: float
    backlog_penalty: float


class ReadinessResponse(BaseModel):
    student_id: str
    readiness_score: float = Field(..., ge=0.0, le=100.0)
    level: str  # "Excellent" | "Good" | "Average" | "Needs Improvement"
    breakdown: ReadinessBreakdown


class SkillGapRequest(BaseModel):
    student_id: str
    student_skills: List[str] = Field(..., description="Skills the student currently has")
    required_skills: List[str] = Field(..., description="Skills required for the target role/company")


class SkillGapResponse(BaseModel):
    student_id: str
    skill_coverage_pct: float = Field(..., ge=0.0, le=100.0)
    matched_skills: List[str]
    missing_skills: List[str]
    priority_missing: List[str] = Field(..., description="Top 5 most important missing skills")
