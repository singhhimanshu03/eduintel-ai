from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.schemas.eligibility import EligibilityRequest
from app.schemas.performance import PerformanceRequest
from app.schemas.dropout import DropoutRequest

router = APIRouter()


class RecommendationRequest(BaseModel):
    student_id: str
    attendance_percentage: float
    avg_internal_marks: float
    prev_semester_gpa: float
    current_gpa: float
    fee_status: str
    backlog_count: int
    internal_marks: List[float]
    attendance_trend: Optional[List[float]] = None
    performance_trend: Optional[List[float]] = None
    fee_paid_ratio: Optional[float] = 1.0


class RecommendationResponse(BaseModel):
    student_id: str
    subjects_needing_attention: List[str]
    attendance_targets: dict
    improvement_plan: List[str]
    overall_risk: str


@router.post("/recommendations/{student_id}", response_model=RecommendationResponse)
async def get_recommendations(student_id: str, req: RecommendationRequest):
    from app.main import model_loader
    from app.routers.eligibility import _predict_one as elig_predict
    from app.routers.performance import _predict_one as perf_predict
    from app.routers.dropout import predict_dropout

    elig_result = elig_predict(
        EligibilityRequest(
            student_id=student_id,
            attendance_percentage=req.attendance_percentage,
            fee_status=req.fee_status,
            avg_internal_marks=req.avg_internal_marks,
            prev_semester_gpa=req.prev_semester_gpa,
        ),
        model_loader.get("eligibility_risk")
    )

    perf_result = perf_predict(
        PerformanceRequest(
            student_id=student_id,
            internal_marks=req.internal_marks,
            attendance_percentage=req.attendance_percentage,
            prev_semester_gpa=req.prev_semester_gpa,
            backlog_count=req.backlog_count,
        ),
        model_loader.get("performance_gpa"),
        model_loader.get("performance_backlog"),
    )

    drop_result = await predict_dropout(DropoutRequest(
        student_id=student_id,
        attendance_trend=req.attendance_trend or [req.attendance_percentage] * 3,
        performance_trend=req.performance_trend or [req.prev_semester_gpa] * 3,
        fee_paid_ratio=req.fee_paid_ratio or 1.0,
        current_gpa=req.current_gpa,
    ))

    # Build improvement plan
    plan: list[str] = []
    targets: dict = {}

    if req.attendance_percentage < 75:
        needed = max(0, (75 * 20 - req.attendance_percentage * 20 / 100 * 20) / (100 - req.attendance_percentage / 100))
        plan.append(f"Attend all remaining classes to recover attendance (currently {req.attendance_percentage}%)")

    for subject in perf_result.flagged_subjects:
        plan.append(f"Prioritize revision for {subject} — high backlog probability detected")
        targets[subject] = {"current_marks": req.internal_marks[int(subject.split("_")[1]) - 1] if req.internal_marks else 0, "target": 50}

    if elig_result.risk_score == "High":
        plan.append("Immediately clear outstanding fee dues to maintain exam eligibility")

    if drop_result.risk_score in ["Medium", "High"]:
        plan.append("Schedule meeting with academic counselor for support")
        plan.append("Enroll in peer tutoring / study group sessions")

    if not plan:
        plan.append("Maintain current performance — you are on track!")

    overall_risk = "High" if elig_result.risk_score == "High" or drop_result.risk_score == "High" else \
                   "Medium" if "Medium" in [elig_result.risk_score, drop_result.risk_score] else "Low"

    return RecommendationResponse(
        student_id=student_id,
        subjects_needing_attention=perf_result.flagged_subjects,
        attendance_targets=targets,
        improvement_plan=plan,
        overall_risk=overall_risk,
    )
