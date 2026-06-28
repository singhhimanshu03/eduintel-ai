"""
Dropout Risk Model wrapper.

Algorithm: Random Forest Classifier (binary — dropout=1, stay=0)

Features (in order):
  - avg_attendance     : float  [0–100]  — mean of attendance_trend
  - avg_gpa            : float  [0–10]   — mean of performance_trend
  - att_slope          : float           — first-difference slope of attendance
  - gpa_slope          : float           — first-difference slope of GPA
  - fee_paid_ratio     : float  [0–1]    — fraction of semesters fee was paid
  - current_gpa        : float  [0–10]

Model filename: dropout_risk_model.pkl
"""

import os
import joblib
import numpy as np
from typing import Optional


class DropoutModel:
    """Wrapper for the Random Forest dropout risk classifier."""

    MODEL_FILENAME = "dropout_risk_model.pkl"
    RISK_THRESHOLDS = {"high": 0.65, "medium": 0.35}

    def __init__(self, model_dir: Optional[str] = None):
        self._model = None
        if model_dir:
            self.load(model_dir)

    def load(self, model_dir: str) -> bool:
        path = os.path.join(model_dir, self.MODEL_FILENAME)
        if not os.path.exists(path):
            return False
        self._model = joblib.load(path)
        return True

    def is_loaded(self) -> bool:
        return self._model is not None

    def predict(self, features: np.ndarray) -> dict:
        """
        Run prediction on a (1, 6) feature array.

        Returns:
            {
                "dropout_probability": float,   # 0–1
                "risk_score": "Low"|"Medium"|"High",
                "needs_alert": bool             # True when prob > high threshold
            }
        """
        if self._model is None:
            raise RuntimeError("Dropout model not loaded.")

        prob = float(self._model.predict_proba(features)[0][1])
        prob = round(max(0.0, min(1.0, prob)), 4)

        risk = (
            "High"   if prob >= self.RISK_THRESHOLDS["high"]   else
            "Medium" if prob >= self.RISK_THRESHOLDS["medium"]  else
            "Low"
        )

        return {
            "dropout_probability": prob,
            "risk_score": risk,
            "needs_alert": prob >= self.RISK_THRESHOLDS["high"],
        }
