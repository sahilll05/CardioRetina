from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_sync_db
from app.models.patient import Patient
from app.models.visit import Visit
from app.schemas.visit import Visit as VisitSchema, VisitCreate
import uuid

router = APIRouter()

@router.post("/", response_model=VisitSchema)
def create_visit(visit: VisitCreate, db: Session = Depends(get_sync_db)):
    """Create a new visit"""
    # Get patient
    patient = db.query(Patient).filter(Patient.patient_id == visit.patient_id).first()
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
    db.commit()
    db.refresh(db_visit)
    return db_visit

@router.get("/{visit_id}", response_model=VisitSchema)
def get_visit(visit_id: str, db: Session = Depends(get_sync_db)):
    """Get visit by visit_id"""
    visit = db.query(Visit).filter(Visit.visit_id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit

@router.get("/patient/{patient_id}", response_model=List[VisitSchema])
def list_patient_visits(patient_id: str, db: Session = Depends(get_sync_db)):
    """List all visits for a patient"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    visits = db.query(Visit).filter(Visit.patient_id == patient.id).all()
    return visits