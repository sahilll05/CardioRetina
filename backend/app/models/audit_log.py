"""
AuditLog Model — CardioRetina AI
Hash-chained, append-only audit log for HIPAA compliance.
Writes go through app/core/audit_chain.py — NEVER via direct inserts.

Hash chain: each row includes sha256(prev_row_hash + this_row_data) so
modifying any historical row breaks the chain — detectable by chain verification.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    # User who performed the action (nullable for system actions)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    # Organization scope
    org_id = Column(Integer, nullable=True, index=True)
    # Action performed, e.g. "PATIENT_READ", "ANALYSIS_START", "LOGIN"
    action = Column(String(128), nullable=False, index=True)
    # Resource that was accessed/modified, e.g. "patient:PAT-XXXX"
    resource = Column(String(256), nullable=True)
    # Request origin
    ip_address = Column(String(64), nullable=True)
    # Additional context (JSON blob)
    details = Column(Text, nullable=True)
    # Timestamp of the event (immutable)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Hash chain fields
    # SHA-256 hash of the PREVIOUS row's row_hash (empty string hash for first row)
    prev_hash = Column(String(64), nullable=False)
    # SHA-256 hash of (prev_hash + user_id + action + resource + timestamp + details)
    row_hash = Column(String(64), nullable=False, unique=True, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
