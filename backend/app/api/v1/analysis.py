from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.visit import Visit
from app.models.analysis import Analysis
from app.schemas.analysis import AnalysisResponse, AnalysisResult
from app.tasks.analysis_task import run_analysis_pipeline
from app.config import settings
import uuid
import os
import shutil
from datetime import datetime

router = APIRouter()

@router.post("/start", response_model=dict)
async def start_analysis(
    patient_id: str = Form(...),
    visit_id: str = Form(...),
    age: int = Form(...),
    bp_systolic: float = Form(None),
    bp_diastolic: float = Form(None),
    blood_sugar: float = Form(None),
    cholesterol: float = Form(None),
    diabetes_history: bool = Form(False),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Start analysis job"""
    
    # Validate visit
    visit = db.query(Visit).filter(Visit.visit_id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Generate job ID
    job_id = f"JOB-{uuid.uuid4().hex[:12].upper()}"
    
    # Save uploaded image
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    image_filename = f"{job_id}_{image.filename}"
    image_path = os.path.join(settings.UPLOAD_DIR, image_filename)
    
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # Create analysis record
    analysis = Analysis(
        job_id=job_id,
        visit_id=visit.id,
        image_path=image_path,
        status="pending",
        started_at=datetime.utcnow()
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Prepare clinical data
    clinical_data = {
        "age": age,
        "bp_systolic": bp_systolic,
        "bp_diastolic": bp_diastolic,
        "blood_sugar": blood_sugar,
        "cholesterol": cholesterol,
        "diabetes_history": diabetes_history
    }
    
    # Start async analysis
    run_analysis_pipeline.delay(job_id, image_path, clinical_data)
    
    return {
        "job_id": job_id,
        "status": "processing"
    }

@router.get("/{job_id}", response_model=AnalysisResponse)
def get_analysis_result(job_id: str, db: Session = Depends(get_db)):
    """Get analysis result"""
    
    analysis = db.query(Analysis).filter(Analysis.job_id == job_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Build response
    result = None
    if analysis.status == "completed":
        result = AnalysisResult(
            status="completed",
            quality={
                "quality_score": analysis.quality_score,
                "is_gradable": analysis.is_gradable == "true"
            } if analysis.quality_score else None,
            biomarkers={
                "av_ratio": analysis.av_ratio,
                "vessel_density": analysis.vessel_density,
                "tortuosity": analysis.tortuosity,
                "branching_angle": analysis.branching_angle
            } if analysis.av_ratio else None,
            disease={
                "dr_grade": analysis.dr_grade,
                "dr_probability": analysis.dr_probability,
                "class_probabilities": analysis.class_probabilities
            } if analysis.dr_grade is not None else None,
            risk={
                "risk_level": analysis.risk_level,
                "confidence": analysis.risk_confidence,
                "reasons": analysis.risk_reasons
            } if analysis.risk_level else None,
            report_url=f"/reports/{os.path.basename(analysis.report_path)}" if analysis.report_path else None
        )
    elif analysis.status == "failed":
        result = AnalysisResult(
            status="failed",
            error_message=analysis.error_message
        )
    else:
        result = AnalysisResult(status=analysis.status)
    
    return AnalysisResponse(
        job_id=job_id,
        status=analysis.status,
        results=result
    )