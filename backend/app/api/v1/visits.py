from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.rbac import get_rls_db, get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.visit import Visit
from app.schemas.visit import Visit as VisitSchema, VisitCreate
import uuid

router = APIRouter()

@router.post("/", response_model=VisitSchema)
async def create_visit(
    visit: VisitCreate, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_db)
):
    """Create a new visit"""
    # Get patient
    result = await db.execute(select(Patient).where(Patient.patient_id == visit.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db_visit = Visit(
        visit_id=f"VIS-{uuid.uuid4().hex[:8].upper()}",
        patient_id=patient.id,
        bp_systolic=visit.bp_systolic,
        bp_diastolic=visit.bp_diastolic,
        blood_sugar=visit.blood_sugar,
        cholesterol=visit.cholesterol,
        hba1c=visit.hba1c
    )
    db.add(db_visit)
    await db.commit()
    await db.refresh(db_visit)
    return db_visit

@router.get("/{visit_id}", response_model=VisitSchema)
async def get_visit(
    visit_id: str, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_db)
):
    """Get visit by visit_id"""
    result = await db.execute(select(Visit).where(Visit.visit_id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit

@router.get("/patient/{patient_id}", response_model=List[VisitSchema])
async def list_patient_visits(
    patient_id: str, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_db)
):
    """List all visits for a patient"""
    result = await db.execute(select(Patient).where(Patient.patient_id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    result = await db.execute(select(Visit).where(Visit.patient_id == patient.id))
    return result.scalars().all()