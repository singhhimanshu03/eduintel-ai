import os
import numpy as np
from fastapi import APIRouter
from app.schemas.forecast import ForecastRequest, ForecastResponse, WeekForecast

router = APIRouter()
THRESHOLD = float(os.getenv("DEFAULT_ELIGIBILITY_THRESHOLD", "75"))


def _get_model():
    try:
        from app.main import model_loader
        return model_loader.get("attendance_forecast")
    except Exception:
        return None


@router.post("/attendance-forecast", response_model=ForecastResponse)
def forecast_attendance(req: ForecastRequest):
    model = _get_model()

    history = np.array(req.weekly_attendance)
    forecasts: list[WeekForecast] = []

    for week in range(1, 5):
        if model:
            # Use model — assumes it predicts next value given last N values
            try:
                pred = float(model.predict(history[-8:].reshape(1, -1))[0])
            except Exception:
                pred = float(np.mean(history))
        else:
            # Simple exponential smoothing fallback (alpha=0.3)
            alpha = 0.3
            smoothed = history[0]
            for v in history[1:]:
                smoothed = alpha * v + (1 - alpha) * smoothed
            # Trend
            trend = (history[-1] - history[0]) / max(len(history) - 1, 1)
            pred = smoothed + trend * week

        pred = max(0.0, min(100.0, pred))
        ci = 5.0  # ±5% confidence interval (simplified)
        forecasts.append(WeekForecast(
            week=week,
            predicted_attendance=round(pred, 2),
            lower_bound=round(max(0, pred - ci), 2),
            upper_bound=round(min(100, pred + ci), 2),
        ))
        history = np.append(history, pred)

    alert = any(f.predicted_attendance < THRESHOLD for f in forecasts[:2])

    return ForecastResponse(
        department_id=req.department_id,
        subject_id=req.subject_id,
        forecast=forecasts,
        below_threshold_alert=alert,
    )
