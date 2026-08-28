from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.rbac import get_rls_db, get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import Patient as PatientSchema, PatientCreate, PatientUpdate
import uuid

router = APIRouter()

@router.post("/", response_model=PatientSchema)
async def create_patient(
    patient: PatientCreate, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_db)
):
    """Create a new patient"""
    db_patient = Patient(
        patient_id=f"PAT-{uuid.uuid4().hex[:8].upper()}",
        org_id=current_user.org_id,
        **patient.dict()
    )
    db.add(db_patient)
    await db.commit()
    await db.refresh(db_patient)
    return db_patient

@router.get("/{patient_id}", response_model=PatientSchema)
async def get_patient(
    patient_id: str, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_db)
):
    """Get patient by patient_id"""
    result = await db.execute(select(Patient).where(Patient.patient_id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/", response_model=List[PatientSchema])
async def list_patients(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_db)
):
    """List all patients"""
    result = await db.execute(select(Patient).offset(skip).limit(limit))
    return result.scalars().all()

@router.put("/{patient_id}", response_model=PatientSchema)
async def update_patient(
    patient_id: str, 
    patient_update: PatientUpdate, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_db)
):
    """Update patient"""
    result = await db.execute(select(Patient).where(Patient.patient_id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    await db.commit()
    await db.refresh(patient)
    return patient

@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_rls_db)
):
    """Delete patient"""
    result = await db.execute(select(Patient).where(Patient.patient_id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    await db.delete(patient)
    await db.commit()
    return {"message": "Patient deleted successfully"}