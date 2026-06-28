import os, time
import numpy as np
from fastapi import APIRouter, HTTPException
from app.schemas.eligibility import EligibilityRequest, EligibilityBatchRequest, EligibilityResponse
from app.services.feature_engineering import build_eligibility_features, classify_risk

router = APIRouter()


def _predict_one(req: EligibilityRequest, model) -> EligibilityResponse:
    features = build_eligibility_features(
        req.attendance_percentage, req.fee_status,
        req.avg_internal_marks, req.prev_semester_gpa
    )
    if model is None:
        # Fallback rule-based
        score = (req.attendance_percentage / 100) * 0.4 + (1 if req.fee_status == "paid" else 0) * 0.3 + \
                (req.avg_internal_marks / 100) * 0.2 + (req.prev_semester_gpa / 10) * 0.1
        prob_high = 1 - score
        risk = classify_risk(prob_high)
        return EligibilityResponse(
            student_id=req.student_id, risk_score=risk,
            confidence=round(abs(score - 0.5) * 2, 3),
            feature_importance={"attendance": 0.4, "fee": 0.3, "marks": 0.2, "gpa": 0.1}
        )
    proba = model.predict_proba(features)[0]
    # Classes: [Low=0, Medium=1, High=2]
    predicted_class = int(np.argmax(proba))
    risk_map = {0: "Low", 1: "Medium", 2: "High"}
    risk = risk_map.get(predicted_class, "Medium")
    confidence = round(float(np.max(proba)), 3)
    importances = {}
    if hasattr(model, "feature_importances_"):
        feature_names = ["attendance", "fee_status", "avg_marks", "prev_gpa"]
        importances = {n: round(float(v), 4) for n, v in zip(feature_names, model.feature_importances_)}
    return EligibilityResponse(
        student_id=req.student_id, risk_score=risk, confidence=confidence,
        feature_importance=importances
    )


@router.post("/eligibility-risk", response_model=EligibilityResponse)
def predict_eligibility(req: EligibilityRequest):
    from app.main import model_loader
    model = model_loader.get("eligibility_risk")
    return _predict_one(req, model)


@router.post("/eligibility-risk/batch")
def predict_eligibility_batch(req: EligibilityBatchRequest):
    if len(req.students) > 500:
        raise HTTPException(status_code=400, detail="Batch size cannot exceed 500")
    from app.main import model_loader
    model = model_loader.get("eligibility_risk")
    start = time.time()
    results = [_predict_one(s, model).model_dump() for s in req.students]
    elapsed = round(time.time() - start, 3)
    return {"success": True, "data": results, "elapsed_seconds": elapsed}


@router.post("/eligibility-risk/summary")
def eligibility_summary():
    """Return aggregated risk counts — used by Analytics Service."""
    return {"success": True, "data": {"low": 0, "medium": 0, "high": 0, "note": "Run batch prediction first"}}
