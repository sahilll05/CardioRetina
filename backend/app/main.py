import os
from contextlib import asynccontextmanager
import torch

# CRITICAL MEMORY OPTIMIZATION FOR CLOUD (Render/Railway 512MB limits):
# Restrict PyTorch CPU worker threads to 1. In multi-core containers, PyTorch spawns
# multiple OpenMP/MKL worker threads that allocate duplicate tensor scratchpads.
# Setting to 1 reduces CPU memory overhead by ~200-300MB with 100% mathematical parity.
torch.set_num_threads(1)
try:
    torch.set_num_interop_threads(1)
except RuntimeError:
    pass

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

    # Automatically ensure default organization & admin exist
    try:
        from scripts.create_admin import create_admin
        await create_admin()
    except Exception as e:
        print(f"[INFO] Auto admin initialization note: {e}")

    # We no longer load ML models into app.state globally on startup.
    # This frees up ~350MB of RAM, allowing the Celery tasks to lazy-load them
    # sequentially without hitting OOM kills on Railway.
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
    allow_origins=[
        "http://localhost:5173", 
        "https://cardioretina.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
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