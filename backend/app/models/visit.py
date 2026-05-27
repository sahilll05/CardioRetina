from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Visit(Base):
    __tablename__ = "visits"
    
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(String, unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # Clinical Data
    bp_systolic = Column(Float)
    bp_diastolic = Column(Float)
    blood_sugar = Column(Float)
    cholesterol = Column(Float)
    hba1c = Column(Float)
    
    visit_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="visits")
    analyses = relationship("Analysis", back_populates="visit", cascade="all, delete-orphan")