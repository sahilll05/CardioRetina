"""
Model Monitoring Service — CardioRetina AI
Detects and logs model drift, out-of-distribution (OOD) inputs, and performance degradation.
"""
import logging
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.ml_interface.pipeline_gateway import PipelineResult

logger = logging.getLogger(__name__)

class ModelMonitor:
    @staticmethod
    def log_inference(result: PipelineResult, org_id: int):
        """
        Log inference metadata for drift detection.
        In a production environment, this might write to a time-series DB (like Prometheus)
        or a dedicated monitoring tool (like Arize, Evidently AI).
        """
        try:
            # Simple check for out-of-distribution inputs (e.g., poor quality)
            quality_score = 0
            if result.quality:
                quality_score = result.quality.get("quality_score", 0)
                
            is_gradable = result.quality.get("is_gradable", False) if result.quality else False
            
            # Simple drift metrics
            vessel_density = result.biomarkers.get("vessel_density", 0) if result.biomarkers else 0
            
            metrics = {
                "timestamp": datetime.utcnow().isoformat(),
                "org_id": org_id,
                "status": result.status,
                "quality_score": quality_score,
                "is_gradable": is_gradable,
                "vessel_density": vessel_density,
                "pipeline_version": result.pipeline_version,
                "config_version": result.config_version,
            }
            
            # For now, we log to a file. 
            # In Phase 5/6, this feeds the Active Learning/MLOps pipeline.
            logger.info(f"Model Monitor Log: {json.dumps(metrics)}")
            
            # Potential alert triggers
            if result.status == 'completed' and not is_gradable:
                logger.warning(f"Drift Alert: Ungradable image processed for org {org_id}")
                
        except Exception as e:
            logger.error(f"Failed to log model monitoring metrics: {e}")
