"""
Student Performance Model wrappers.

Two models are used together:
  1. GPA Predictor  — XGBoostRegressor
     Features: avg_internal_marks, attendance_pct, prev_gpa, backlog_count
     Output:   predicted_gpa  (float, 0–10)

  2. Backlog Classifier — RandomForestClassifier (per-subject)
     Features: subject_marks, attendance_pct, prev_gpa, backlog_count
     Output:   backlog_probability (float, 0–1)

Model filenames (saved by training/train_all.py):
  - performance_gpa_model.pkl
  - performance_backlog_model.pkl
"""

import os
import joblib
import numpy as np
from typing import Optional


class PerformanceGPAModel:
    """Wrapper for the XGBoost GPA regression model."""

    MODEL_FILENAME = "performance_gpa_model.pkl"

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

    def predict(self, features: np.ndarray) -> float:
        """
        Predict GPA for a (1, 4) feature array.
        Returns predicted GPA clamped to [0.0, 10.0].
        """
        if self._model is None:
            raise RuntimeError("GPA model not loaded.")
        raw = float(self._model.predict(features)[0])
        return round(max(0.0, min(10.0, raw)), 2)


class PerformanceBacklogModel:
    """Wrapper for the Random Forest backlog probability classifier."""

    MODEL_FILENAME = "performance_backlog_model.pkl"

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

    def predict_proba_backlog(self, subject_marks: float, attendance_pct: float,
                               prev_gpa: float, backlog_count: int) -> float:
        """
        Return probability (0–1) that the student will get a backlog in this subject.
        """
        if self._model is None:
            raise RuntimeError("Backlog model not loaded.")
        features = np.array([[subject_marks, attendance_pct, prev_gpa, backlog_count]])
        return round(float(self._model.predict_proba(features)[0][1]), 4)
