"""
User Model — CardioRetina AI
Represents a hospital staff member with a role and organization scope.
"""
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    TECHNICIAN = "TECHNICIAN"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # Organization this user belongs to (mandatory tenant scope)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    email = Column(String(256), unique=True, index=True, nullable=False)
    hashed_password = Column(String(512), nullable=False)
    full_name = Column(String(256), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.TECHNICIAN)
    is_active = Column(Boolean, default=True, nullable=False)
    # MFA (TOTP) — secret stored encrypted at rest
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(256), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
