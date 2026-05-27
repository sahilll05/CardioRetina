from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class PatientBase(BaseModel):
    name: str
    age: int
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    diabetes_history: bool = False
    hypertension: bool = False

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    diabetes_history: Optional[bool] = None
    hypertension: Optional[bool] = None

class Patient(PatientBase):
    id: int
    patient_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True