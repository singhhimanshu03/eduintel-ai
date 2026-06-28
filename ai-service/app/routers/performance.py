import time
import numpy as np
from fastapi import HTTPException
from fastapi import APIRouter
from app.schemas.performance import PerformanceRequest, PerformanceBatchRequest, PerformanceResponse
from app.services.feature_engineering import build_performance_features

router = APIRouter()


def _predict_one(req: PerformanceRequest, gpa_model, backlog_model) -> PerformanceResponse:
    features = build_performance_features(
        req.internal_marks, req.attendance_percentage,
        req.prev_semester_gpa, req.backlog_count
    )
    # GPA prediction
    if gpa_model:
        pred_gpa = float(gpa_model.predict(features)[0])
    else:
        avg_marks = float(np.mean(req.internal_marks)) if req.internal_marks else 0
        pred_gpa = round((avg_marks / 100) * 10 * 0.6 + req.prev_semester_gpa * 0.4, 2)

    pred_gpa = max(0.0, min(10.0, pred_gpa))
    gpa_lower = round(max(0.0, pred_gpa - 0.5), 2)
    gpa_upper = round(min(10.0, pred_gpa + 0.5), 2)

    # Backlog probability per subject
    backlog_probs: dict[str, float] = {}
    flagged: list[str] = []
    for i, marks in enumerate(req.internal_marks):
        subject_key = f"subject_{i+1}"
        if backlog_model:
            feat = np.array([[marks, req.attendance_percentage, req.prev_semester_gpa, req.backlog_count]])
            prob = float(backlog_model.predict_proba(feat)[0][1])
        else:
            # Rule-based fallback
            prob = max(0.0, min(1.0, 1 - (marks / 100)))
        backlog_probs[subject_key] = round(prob, 3)
        if prob > 0.70:
            flagged.append(subject_key)

    return PerformanceResponse(
        student_id=req.student_id,
        predicted_gpa_lower=gpa_lower,
        predicted_gpa_upper=gpa_upper,
        backlog_probability=backlog_probs,
        flagged_subjects=flagged,
    )


@router.post("/performance-predict", response_model=PerformanceResponse)
def predict_performance(req: PerformanceRequest):
    from app.main import model_loader
    return _predict_one(req, model_loader.get("performance_gpa"), model_loader.get("performance_backlog"))


@router.post("/performance-predict/batch")
def predict_performance_batch(req: PerformanceBatchRequest):
    if len(req.students) > 500:
        raise HTTPException(400, "Batch size cannot exceed 500")
    from app.main import model_loader
    gpa_m = model_loader.get("performance_gpa")
    back_m = model_loader.get("performance_backlog")
    start = time.time()
    results = [_predict_one(s, gpa_m, back_m).model_dump() for s in req.students]
    return {"success": True, "data": results, "elapsed_seconds": round(time.time() - start, 3)}
