from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List

router = APIRouter()


class ReadinessRequest(BaseModel):
    student_id: str
    cgpa: float = Field(..., ge=0, le=10)
    backlog_count: int = Field(..., ge=0)
    skill_count: int = Field(..., ge=0)
    mock_interview_score: float = Field(default=0, ge=0, le=100)


class SkillGapRequest(BaseModel):
    student_id: str
    student_skills: List[str]
    required_skills: List[str]


@router.post("/placement/readiness-score")
def placement_readiness(req: ReadinessRequest):
    # Weighted scoring formula
    gpa_score       = (req.cgpa / 10) * 40
    backlog_penalty = min(req.backlog_count * 5, 20)
    skill_score     = min(req.skill_count * 3, 30)
    interview_score = (req.mock_interview_score / 100) * 30

    raw = gpa_score + skill_score + interview_score - backlog_penalty
    score = round(max(0.0, min(100.0, raw)), 2)

    level = "Excellent" if score >= 80 else "Good" if score >= 60 else "Average" if score >= 40 else "Needs Improvement"
    return {
        "success": True,
        "data": {
            "student_id": req.student_id,
            "readiness_score": score,
            "level": level,
            "breakdown": {
                "gpa_contribution": round(gpa_score, 2),
                "skill_contribution": round(skill_score, 2),
                "interview_contribution": round(interview_score, 2),
                "backlog_penalty": round(backlog_penalty, 2),
            }
        }
    }


@router.post("/placement/skill-gap")
def skill_gap_analysis(req: SkillGapRequest):
    student_set  = {s.lower().strip() for s in req.student_skills}
    required_set = {s.lower().strip() for s in req.required_skills}
    missing = sorted(required_set - student_set)
    matched = sorted(student_set & required_set)
    coverage = round(len(matched) / len(required_set) * 100, 1) if required_set else 100.0

    return {
        "success": True,
        "data": {
            "student_id": req.student_id,
            "skill_coverage_pct": coverage,
            "matched_skills": matched,
            "missing_skills": missing,
            "priority_missing": missing[:5],   # Top 5 to address first
        }
    }
