from pydantic import BaseModel, Field
from typing import List, Annotated
from pydantic.functional_validators import AfterValidator


def _check_8_weeks(v: List[float]) -> List[float]:
    if len(v) != 8:
        raise ValueError('weekly_attendance must have exactly 8 values')
    return v


class ForecastRequest(BaseModel):
    department_id: str
    subject_id: str
    weekly_attendance: Annotated[List[float], AfterValidator(_check_8_weeks)]


class WeekForecast(BaseModel):
    week: int
    predicted_attendance: float
    lower_bound: float
    upper_bound: float


class ForecastResponse(BaseModel):
    department_id: str
    subject_id: str
    forecast: List[WeekForecast]
    below_threshold_alert: bool
