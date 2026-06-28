import numpy as np
import pandas as pd
from typing import List


def build_eligibility_features(
    attendance_pct: float,
    fee_status: str,        # "paid" | "unpaid" | "partially_paid"
    avg_internal_marks: float,
    prev_gpa: float,
) -> np.ndarray:
    fee_encoded = 1.0 if fee_status == "paid" else (0.5 if fee_status == "partially_paid" else 0.0)
    return np.array([[attendance_pct, fee_encoded, avg_internal_marks, prev_gpa]])


def build_performance_features(
    internal_marks: List[float],
    attendance_pct: float,
    prev_gpa: float,
    backlog_count: int,
) -> np.ndarray:
    avg_marks = float(np.mean(internal_marks)) if internal_marks else 0.0
    return np.array([[avg_marks, attendance_pct, prev_gpa, backlog_count]])


def build_dropout_features(
    att_trend: List[float],   # last 3 semesters attendance %
    perf_trend: List[float],  # last 3 semesters GPA
    fee_paid_ratio: float,    # fraction of semesters where fee was paid
    current_gpa: float,
) -> np.ndarray:
    avg_att  = float(np.mean(att_trend))  if att_trend  else 0.0
    avg_gpa  = float(np.mean(perf_trend)) if perf_trend else 0.0
    att_slope  = float(att_trend[-1]  - att_trend[0])  if len(att_trend)  >= 2 else 0.0
    gpa_slope  = float(perf_trend[-1] - perf_trend[0]) if len(perf_trend) >= 2 else 0.0
    return np.array([[avg_att, avg_gpa, att_slope, gpa_slope, fee_paid_ratio, current_gpa]])


def classify_risk(probability: float) -> str:
    if probability >= 0.65:
        return "High"
    elif probability >= 0.35:
        return "Medium"
    return "Low"
