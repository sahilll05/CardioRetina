from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String)
    phone = Column(String)
    email = Column(String)
    
    # Medical History
    diabetes_history = Column(Boolean, default=False)
    hypertension = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")