from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1 import api_router
from app.database import engine, Base
from app.config import settings
import os

# Create tables
Base.metadata.create_all(bind=engine)

# Create directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)

app = FastAPI(
    title="CardioRetina AI API",
    description="AI-powered cardiovascular risk assessment from retinal images",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/reports", StaticFiles(directory=settings.REPORT_DIR), name="reports")

# Include routers
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """Load ML models on startup"""
    from ml.models.quality.inference import QualityInference
    from ml.models.vessel.inference import VesselInference
    from ml.models.av.inference import AVInference
    from ml.models.disease.inference import DiseaseInference
    
    # Load models
    app.state.quality_model = QualityInference()
    app.state.vessel_model = VesselInference()
    app.state.av_model = AVInference()
    app.state.disease_model = DiseaseInference()
    
    print("✅ All models loaded successfully")

@app.get("/")
def root():
    return {
        "message": "CardioRetina AI API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )