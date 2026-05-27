from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True, nullable=False)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    
    # Image
    image_path = Column(String, nullable=False)
    
    # Status
    status = Column(String, default="pending")  # pending, processing, completed, failed
    
    # Quality
    quality_score = Column(Float)
    is_gradable = Column(String)
    
    # Biomarkers
    av_ratio = Column(Float)
    vessel_density = Column(Float)
    tortuosity = Column(Float)
    branching_angle = Column(Float)
    
    # Disease
    dr_grade = Column(Integer)
    dr_probability = Column(Float)
    class_probabilities = Column(JSON)
    
    # Risk
    risk_level = Column(String)
    risk_confidence = Column(Float)
    risk_reasons = Column(JSON)
    
    # Report
    report_path = Column(String)
    
    # Masks (stored as paths)
    vessel_mask_path = Column(String)
    artery_mask_path = Column(String)
    vein_mask_path = Column(String)
    
    # Error
    error_message = Column(Text)
    
    # Timestamps
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    visit = relationship("Visit", back_populates="analyses")