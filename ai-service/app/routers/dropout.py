import os, httpx
from fastapi import APIRouter
from app.schemas.dropout import DropoutRequest, DropoutResponse
from app.services.feature_engineering import build_dropout_features, classify_risk

router = APIRouter()

# Lazy accessor — avoids circular import with app.main
def _get_model():
    try:
        from app.main import model_loader
        return model_loader.get("dropout_risk")
    except Exception:
        return None


@router.post("/dropout-risk", response_model=DropoutResponse)
async def predict_dropout(req: DropoutRequest):
    model = _get_model()
    features = build_dropout_features(
        req.attendance_trend, req.performance_trend,
        req.fee_paid_ratio, req.current_gpa
    )

    if model:
        prob = float(model.predict_proba(features)[0][1])
    else:
        # Rule-based fallback
        att_avg = sum(req.attendance_trend) / len(req.attendance_trend) if req.attendance_trend else 75
        gpa_avg = sum(req.performance_trend) / len(req.performance_trend) if req.performance_trend else 5
        prob = round(
            (1 - att_avg / 100) * 0.35 +
            (1 - gpa_avg / 10) * 0.35 +
            (1 - req.fee_paid_ratio) * 0.20 +
            (1 - req.current_gpa / 10) * 0.10, 3
        )

    risk = classify_risk(prob)

    risk_factors = []
    if req.attendance_trend and min(req.attendance_trend) < 60:
        risk_factors.append("Critically low attendance in at least one semester")
    if req.performance_trend and min(req.performance_trend) < 4.0:
        risk_factors.append("GPA below 4.0 in at least one semester")
    if req.fee_paid_ratio < 0.5:
        risk_factors.append("Fee payment inconsistency across semesters")
    if req.current_gpa < 4.5:
        risk_factors.append("Current GPA below acceptable threshold")

    # Alert on high risk
    if prob > 0.65:
        notif_url = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:3007")
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(f"{notif_url}/api/notifications/send", json={
                    "eventType": "dropout_risk_alert", "channel": "in_app",
                    "subject": "High Dropout Risk Alert",
                    "message": f"Student {req.student_id} has a high dropout probability of {prob:.0%}. Risk factors: {', '.join(risk_factors) or 'multiple factors'}",
                    "broadcast": False
                }, headers={"x-internal-secret": os.getenv("INTERNAL_SERVICE_SECRET", "")})
        except Exception:
            pass  # Non-blocking

    return DropoutResponse(
        student_id=req.student_id, dropout_probability=round(prob, 3),
        risk_score=risk, risk_factors=risk_factors
    )
