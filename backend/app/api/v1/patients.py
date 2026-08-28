from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_sync_db
from app.models.patient import Patient
from app.schemas.patient import Patient as PatientSchema, PatientCreate, PatientUpdate
import uuid

router = APIRouter()

@router.post("/", response_model=PatientSchema)
def create_patient(patient: PatientCreate, db: Session = Depends(get_sync_db)):
    """Create a new patient"""
    db_patient = Patient(
        patient_id=f"PAT-{uuid.uuid4().hex[:8].upper()}",
        **patient.dict()
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/{patient_id}", response_model=PatientSchema)
def get_patient(patient_id: str, db: Session = Depends(get_sync_db)):
    """Get patient by patient_id"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/", response_model=List[PatientSchema])
def list_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_sync_db)):
    """List all patients"""
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients

@router.put("/{patient_id}", response_model=PatientSchema)
def update_patient(patient_id: str, patient_update: PatientUpdate, db: Session = Depends(get_sync_db)):
    """Update patient"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{patient_id}")
def delete_patient(patient_id: str, db: Session = Depends(get_sync_db)):
    """Delete patient"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully"}