"""
Patient Model — CardioRetina AI
Multi-tenant: every patient is scoped to an organization (org_id).
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=False)

    # Multi-tenant scope — every patient belongs to exactly one organization
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

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
    organization = relationship("Organization", back_populates="patients")
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")