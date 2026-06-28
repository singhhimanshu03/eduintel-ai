from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.services.model_loader import ModelLoader
from app.routers import eligibility, performance, dropout, forecast, recommendations, placement_ai, faculty_ai

model_loader = ModelLoader()
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_loader.load_all()
    # Daily: eligibility risk re-evaluation
    scheduler.add_job(model_loader.daily_risk_evaluation, "cron", hour=2, minute=0)
    # Weekly: dropout risk re-evaluation
    scheduler.add_job(model_loader.weekly_dropout_evaluation, "cron", day_of_week="mon", hour=3)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="EduIntel AI — AI Prediction Service",
    version="1.0.0",
    description="ML prediction endpoints for eligibility risk, performance, dropout, attendance forecasting, and recommendations.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def internal_secret_guard(request: Request, call_next):
    """Protect AI service — only API Gateway or internal services may call it."""
    import os
    secret = os.getenv("INTERNAL_SERVICE_SECRET", "")
    # Allow docs and health publicly
    if request.url.path in ["/docs", "/openapi.json", "/health", "/"]:
        return await call_next(request)
    provided = request.headers.get("x-internal-secret", "")
    if secret and provided != secret:
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)


app.include_router(eligibility.router,        prefix="/api/ai",       tags=["Eligibility Risk"])
app.include_router(performance.router,        prefix="/api/ai",       tags=["Performance Prediction"])
app.include_router(dropout.router,            prefix="/api/ai",       tags=["Dropout Risk"])
app.include_router(forecast.router,           prefix="/api/ai",       tags=["Attendance Forecast"])
app.include_router(recommendations.router,    prefix="/api/ai",       tags=["Recommendations"])
app.include_router(placement_ai.router,       prefix="/api/ai",       tags=["Placement AI"])
app.include_router(faculty_ai.router,         prefix="/api/ai",       tags=["Faculty AI"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service", "models_loaded": model_loader.status()}


@app.get("/api/ai/models/versions")
def model_versions():
    return {"success": True, "data": model_loader.get_versions()}
