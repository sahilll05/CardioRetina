from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class ClinicalData(BaseModel):
    age: int
    bp_systolic: Optional[float] = None
    bp_diastolic: Optional[float] = None
    blood_sugar: Optional[float] = None
    cholesterol: Optional[float] = None
    diabetes_history: bool = False

class AnalysisCreate(BaseModel):
    patient_id: str
    visit_id: str
    clinical_data: ClinicalData

class QualityResult(BaseModel):
    quality_score: float
    is_gradable: bool

class BiomarkerResult(BaseModel):
    av_ratio: Optional[float] = None
    vessel_density: Optional[float] = None
    tortuosity: Optional[float] = None
    branching_angle: Optional[float] = None

class DiseaseResult(BaseModel):
    dr_grade: int
    dr_probability: float
    class_probabilities: List[float]

class RiskResult(BaseModel):
    risk_level: str
    confidence: float
    reasons: List[str]

class AnalysisResult(BaseModel):
    status: str
    quality: Optional[QualityResult] = None
    biomarkers: Optional[BiomarkerResult] = None
    disease: Optional[DiseaseResult] = None
    risk: Optional[RiskResult] = None
    report_url: Optional[str] = None
    error_message: Optional[str] = None

class AnalysisResponse(BaseModel):
    job_id: str
    status: str
    results: Optional[AnalysisResult] = None
    
    class Config:
        from_attributes = True