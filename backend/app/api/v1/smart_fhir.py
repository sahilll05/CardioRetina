"""
SMART-on-FHIR API — CardioRetina AI
Endpoints to expose analysis results as standard FHIR R4 resources.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.core.rbac import get_current_user
from app.models.analysis import Analysis
from app.models.patient import Patient
from app.services.fhir_service import FHIRService

router = APIRouter()

@router.get("/Patient/{patient_id}")
async def get_fhir_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve Patient resource."""
    result = await db.execute(select(Patient).where(Patient.patient_id == patient_id, Patient.org_id == current_user.org_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return FHIRService.patient_to_fhir(patient)


@router.get("/DiagnosticReport")
async def search_diagnostic_report(
    patient: str,  # patient reference, e.g. Patient/PAT-123
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search DiagnosticReport by Patient reference."""
    if not patient.startswith("Patient/"):
        raise HTTPException(status_code=400, detail="Invalid patient reference format. Use Patient/ID.")
        
    patient_id = patient.split("/")[1]
    
    # Verify patient belongs to org
    res_pat = await db.execute(select(Patient).where(Patient.patient_id == patient_id, Patient.org_id == current_user.org_id))
    db_patient = res_pat.scalar_one_or_none()
    
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Get all analyses for this patient
    res_analyses = await db.execute(select(Analysis).where(Analysis.visit.has(patient_id=db_patient.id)))
    analyses = res_analyses.scalars().all()
    
    reports = []
    for analysis in analyses:
        visit = analysis.visit
        reports.append(FHIRService.analysis_to_fhir_diagnostic_report(analysis, db_patient, visit))
        
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(reports),
        "entry": [{"resource": r} for r in reports]
    }


@router.get("/Bundle/{job_id}")
async def get_fhir_bundle(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a complete FHIR Bundle for a specific Analysis run."""
    result = await db.execute(select(Analysis).where(Analysis.job_id == job_id))
    analysis = result.scalar_one_or_none()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    visit = analysis.visit
    patient = visit.patient
    
    # Org check
    if patient.org_id != current_user.org_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    return FHIRService.analysis_to_fhir_bundle(analysis, patient, visit)
