import os
import joblib
import logging
from pathlib import Path

logger = logging.getLogger(__name__)
MODEL_DIR = Path(os.getenv("MODEL_DIR", "./app/models"))


class ModelLoader:
    def __init__(self):
        self.models: dict = {}
        self.versions: dict = {}

    def _load(self, name: str, filename: str):
        path = MODEL_DIR / filename
        if path.exists():
            self.models[name] = joblib.load(path)
            # Version = file modification timestamp
            self.versions[name] = {
                "file": filename,
                "mtime": os.path.getmtime(path),
            }
            logger.info(f"Loaded model: {name}")
        else:
            logger.warning(f"Model not found: {path} — using fallback")
            self.models[name] = None

    def load_all(self):
        self._load("eligibility_risk",   "eligibility_risk_model.pkl")
        self._load("performance_gpa",    "performance_gpa_model.pkl")
        self._load("performance_backlog","performance_backlog_model.pkl")
        self._load("dropout_risk",       "dropout_risk_model.pkl")
        self._load("attendance_forecast","attendance_forecast_model.pkl")

    def get(self, name: str):
        return self.models.get(name)

    def status(self) -> dict:
        return {k: v is not None for k, v in self.models.items()}

    def get_versions(self) -> dict:
        return self.versions

    async def daily_risk_evaluation(self):
        """Scheduled: re-run eligibility risk for all active students."""
        import httpx, os
        student_url = os.getenv("STUDENT_SERVICE_URL", "http://student-service:3002")
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{student_url}/api/students?limit=1000",
                                        headers={"x-internal-secret": os.getenv("INTERNAL_SERVICE_SECRET","")})
                students = resp.json().get("data", [])
                logger.info(f"Daily risk eval: {len(students)} students")
        except Exception as e:
            logger.error(f"Daily risk eval failed: {e}")

    async def weekly_dropout_evaluation(self):
        logger.info("Weekly dropout risk evaluation triggered")
