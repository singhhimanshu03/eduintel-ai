"""
Faculty AI endpoints.

Provides the /api/ai/faculty/{faculty_id}/flagged-students endpoint that the
Analytics Service uses to populate the Faculty Dashboard "AI Alerts" panel.

It calls the Student Service to fetch students assigned to this faculty's
subjects, then runs batch eligibility risk prediction and returns only the
students classified as Medium or High risk.
"""

import os
import httpx
from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.eligibility import EligibilityRequest
from app.routers.eligibility import _predict_one

router = APIRouter()

STUDENT_SERVICE_URL = os.getenv("STUDENT_SERVICE_URL", "http://student-service:3002")
ATTENDANCE_SERVICE_URL = os.getenv("ATTENDANCE_SERVICE_URL", "http://attendance-service:3004")
INTERNAL_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "")

_INTERNAL_HEADERS = {"x-internal-secret": INTERNAL_SECRET}


@router.get("/faculty/{faculty_id}/flagged-students")
async def get_flagged_students(faculty_id: str):
    """
    Return students that the AI considers at-risk (Medium or High eligibility risk)
    for the subjects taught by this faculty member.

    Strategy:
    1. Fetch this faculty's active subject assignments from student-service.
    2. For each subject, fetch students with their attendance summaries.
    3. Run eligibility risk prediction on each student.
    4. Return only Medium/High risk students with their risk score and a
       recommended action string.

    Falls back gracefully if any downstream service is unavailable.
    """
    from app.main import model_loader

    flagged = []

    async with httpx.AsyncClient(timeout=10) as client:
        # ── Step 1: Get faculty subject assignments ──────────────────────────
        try:
            resp = await client.get(
                f"{STUDENT_SERVICE_URL}/api/students",
                headers={**_INTERNAL_HEADERS, "x-user-id": faculty_id},
                params={"limit": "200"},
            )
            students: List[dict] = resp.json().get("data", []) if resp.is_success else []
        except Exception:
            students = []

        if not students:
            # Return empty gracefully — no data yet or service unavailable
            return {"success": True, "data": []}

        # ── Step 2: Fetch attendance for each student & run prediction ───────
        model = model_loader.get("eligibility_risk")

        for student in students[:100]:  # cap at 100 for performance
            student_id = student.get("id", "")
            if not student_id:
                continue

            # Fetch attendance summary
            try:
                att_resp = await client.get(
                    f"{ATTENDANCE_SERVICE_URL}/api/attendance/students/{student_id}",
                    headers=_INTERNAL_HEADERS,
                )
                att_data: List[dict] = att_resp.json().get("data", []) if att_resp.is_success else []
            except Exception:
                att_data = []

            avg_att = (
                sum(float(a.get("attendance_percentage", 75)) for a in att_data) / len(att_data)
                if att_data else 75.0
            )

            # Build a minimal eligibility request with available data
            req = EligibilityRequest(
                student_id=student_id,
                attendance_percentage=avg_att,
                fee_status="paid",          # conservative default — fee not available here
                avg_internal_marks=60.0,    # default until marks endpoint available
                prev_semester_gpa=7.0,      # default
            )

            try:
                prediction = _predict_one(req, model)
            except Exception:
                continue

            # Only surface Medium / High risk students
            if prediction.risk_score in ("Medium", "High"):
                action = (
                    "Immediate counselling required — critical risk detected"
                    if prediction.risk_score == "High"
                    else "Monitor closely and provide academic support"
                )
                flagged.append({
                    "student_id": student_id,
                    "student_name": student.get("full_name", student_id),
                    "risk_score": prediction.risk_score,
                    "confidence": prediction.confidence,
                    "avg_attendance": round(avg_att, 1),
                    "recommended_action": action,
                })

    # Sort: High first, then Medium
    flagged.sort(key=lambda x: (0 if x["risk_score"] == "High" else 1))
    return {"success": True, "data": flagged}
