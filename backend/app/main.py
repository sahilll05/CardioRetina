import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import api_router
from app.database import async_engine, Base
from app.config import settings

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)


# ─── Lifespan: startup + shutdown ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Async lifespan context manager replaces the deprecated @app.on_event("startup").
    Runs table creation and model loading on startup; cleans up on shutdown.
    """
    # Import all models so Base.metadata knows all tables before create_all
    from app import models  # noqa: F401

    # Create tables via async engine
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Load ML models into app.state (unchanged — same models, same loading logic)
    from ml.models.quality.inference import QualityInference
    from ml.models.vessel.inference import VesselInference
    from ml.models.av.inference import AVInference
    from ml.models.disease.inference import DiseaseInference

    app.state.quality_model = QualityInference()
    app.state.vessel_model = VesselInference()
    app.state.av_model = AVInference()
    app.state.disease_model = DiseaseInference()

    print("[OK] All ML models loaded successfully")
    print("[OK] Database tables verified")

    yield  # Application runs here

    # Shutdown: dispose async engine connection pool
    await async_engine.dispose()
    print("[OK] Database engine disposed")


# ─── FastAPI Application ───────────────────────────────────────────────────────
app = FastAPI(
    title="CardioRetina AI API",
    description=(
        "Clinical decision-support platform for non-invasive cardiovascular risk "
        "stratification and diabetic retinopathy grading from retinal fundus images."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────────────────────────────────────────
# NOTE: In production, restrict allow_origins to specific hospital domain(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static File Mounts ────────────────────────────────────────────────────────
app.mount("/reports", StaticFiles(directory=settings.REPORT_DIR), name="reports")

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


# ─── Health / Root Endpoints ──────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "CardioRetina AI API",
        "version": "1.0.0",
        "status": "running",
        "positioning": "Clinical decision support — not autonomous diagnosis",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ─── Dev entrypoint ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )