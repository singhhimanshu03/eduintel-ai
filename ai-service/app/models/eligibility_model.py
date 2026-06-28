"""
Eligibility Risk Model wrapper.

Algorithm: Random Forest Classifier
Output classes: Low (0), Medium (1), High (2)

Features (in order):
  - attendance_percentage  : float  [0–100]
  - fee_status_encoded     : float  0=unpaid, 0.5=partially_paid, 1=paid
  - avg_internal_marks     : float  [0–100]
  - prev_semester_gpa      : float  [0–10]
"""

import os
import joblib
import numpy as np
from typing import Optional


MODEL_FILENAME = "eligibility_risk_model.pkl"


class EligibilityModel:
    """Thin wrapper around the trained RandomForestClassifier for eligibility risk."""

    CLASS_LABELS = {0: "Low", 1: "Medium", 2: "High"}

    def __init__(self, model_dir: Optional[str] = None):
        self._model = None
        self._model_path: Optional[str] = None
        if model_dir:
            self.load(model_dir)

    # ------------------------------------------------------------------
    def load(self, model_dir: str) -> bool:
        """Load model from disk. Returns True on success, False if file not found."""
        path = os.path.join(model_dir, MODEL_FILENAME)
        if not os.path.exists(path):
            return False
        self._model = joblib.load(path)
        self._model_path = path
        return True

    # ------------------------------------------------------------------
    def is_loaded(self) -> bool:
        return self._model is not None

    # ------------------------------------------------------------------
    def predict(self, features: np.ndarray) -> dict:
        """
        Run prediction on a (1, 4) feature array.

        Returns:
            {
                "risk_score": "Low" | "Medium" | "High",
                "confidence": float,
                "class_probabilities": {"Low": float, "Medium": float, "High": float},
                "feature_importances": dict[str, float]  # only if model exposes them
            }
        """
        if self._model is None:
            raise RuntimeError("Model not loaded. Run training/train_all.py first.")

        proba = self._model.predict_proba(features)[0]
        predicted_idx = int(np.argmax(proba))

        result = {
            "risk_score": self.CLASS_LABELS[predicted_idx],
            "confidence": round(float(np.max(proba)), 4),
            "class_probabilities": {
                "Low":    round(float(proba[0]), 4),
                "Medium": round(float(proba[1]), 4),
                "High":   round(float(proba[2]), 4),
            },
        }

        if hasattr(self._model, "feature_importances_"):
            names = ["attendance", "fee_status", "avg_marks", "prev_gpa"]
            result["feature_importances"] = {
                n: round(float(v), 4)
                for n, v in zip(names, self._model.feature_importances_)
            }

        return result

    # ------------------------------------------------------------------
    def model_path(self) -> Optional[str]:
        return self._model_path
