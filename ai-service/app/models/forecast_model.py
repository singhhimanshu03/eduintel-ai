"""
Attendance Forecast Model wrapper.

The model predicts future weekly attendance from the last N weeks of history.

Algorithm: Random Forest Regressor trained on sliding-window sequences.

Features: last 8 weeks of attendance values (or zero-padded if fewer available)
Output:   predicted attendance for the next week (float, clamped to [0, 100])

Model filename: attendance_forecast_model.pkl

If no trained model is available, the router falls back to exponential smoothing
(see app/routers/forecast.py).
"""

import os
import joblib
import numpy as np
from typing import Optional


class ForecastModel:
    """Wrapper for the attendance forecasting model."""

    MODEL_FILENAME = "attendance_forecast_model.pkl"
    WINDOW_SIZE = 8  # number of past weeks the model expects as input

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

    def predict_next(self, history: np.ndarray) -> float:
        """
        Predict the next week's attendance given a history array.

        Args:
            history: 1-D array of attendance values. Will be windowed to last
                     WINDOW_SIZE entries and zero-padded on the left if shorter.

        Returns:
            Predicted attendance percentage clamped to [0.0, 100.0].
        """
        if self._model is None:
            raise RuntimeError("Forecast model not loaded.")

        window = history[-self.WINDOW_SIZE:]
        if len(window) < self.WINDOW_SIZE:
            pad = np.zeros(self.WINDOW_SIZE - len(window))
            window = np.concatenate([pad, window])

        raw = float(self._model.predict(window.reshape(1, -1))[0])
        return round(max(0.0, min(100.0, raw)), 2)
