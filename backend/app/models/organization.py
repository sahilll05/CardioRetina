"""
Organization (Tenant) Model — CardioRetina AI
Represents a hospital, clinic, or diagnostic center using the platform.
All patient/visit/analysis records are scoped to an organization.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    # Human-readable short code (e.g., "AIIMS-DELHI", "PGIMER")
    code = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(256), nullable=False)
    # License key for enterprise/SaaS access control
    license_key = Column(String(128), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    # Optional contact metadata
    contact_email = Column(String(256))
    address = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    patients = relationship("Patient", back_populates="organization", cascade="all, delete-orphan")
