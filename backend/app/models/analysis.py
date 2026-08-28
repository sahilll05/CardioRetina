"""
Analysis Model — CardioRetina AI
Stores the full results of one AI pipeline run, including versioned model metadata.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True, nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, index=True)

    # Image
    image_path = Column(String, nullable=False)

    # Status: pending | processing | completed | failed
    status = Column(String, default="pending", nullable=False, index=True)

    # Quality
    quality_score = Column(Float)
    is_gradable = Column(String)  # "true" | "false" (stored as string for legacy compat)

    # Biomarkers
    av_ratio = Column(Float)
    vessel_density = Column(Float)
    tortuosity = Column(Float)
    branching_angle = Column(Float)

    # Disease (DR Grading)
    dr_grade = Column(Integer)
    dr_probability = Column(Float)
    class_probabilities = Column(JSON)

    # Risk (CVD)
    risk_level = Column(String)       # LOW | MODERATE | HIGH
    risk_confidence = Column(Float)
    risk_score = Column(Integer)
    risk_reasons = Column(JSON)

    # Report
    report_path = Column(String)

    # Image artifacts (stored paths)
    vessel_mask_path = Column(String)
    artery_mask_path = Column(String)
    vein_mask_path = Column(String)
    # A/V color-coded overlay image at original resolution (Task 5.1 / build.md §11.4)
    av_overlay_path = Column(String)

    # Model version metadata (from pipeline_gateway.py versioned result object)
    pipeline_version = Column(String)       # e.g. "v1.0.0"
    quality_model_version = Column(String)  # e.g. "QUALITY-v1.0.0"
    vessel_model_version = Column(String)
    av_model_version = Column(String)
    disease_model_version = Column(String)
    risk_module_version = Column(String)    # e.g. "RISK-v1.0.0"
    config_version = Column(String)         # e.g. "v1-baseline"

    # Error
    error_message = Column(Text)

    # Ingestion metadata (which protocol delivered this image)
    ingestion_source = Column(String)       # "manual_upload" | "dicom_scp" | "hot_folder" | "dicomweb_stow"

    # Timestamps
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    visit = relationship("Visit", back_populates="analyses")