from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VisitBase(BaseModel):
    bp_systolic: Optional[float] = None
    bp_diastolic: Optional[float] = None
    blood_sugar: Optional[float] = None
    cholesterol: Optional[float] = None
    hba1c: Optional[float] = None

class VisitCreate(VisitBase):
    patient_id: str

class Visit(VisitBase):
    id: int
    visit_id: str
    patient_id: int
    visit_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True