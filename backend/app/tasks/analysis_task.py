"""
Analysis Celery Task — CardioRetina AI
Executes the ML pipeline via PipelineGateway, updates the database with versioned results,
and publishes real-time progress to Redis for WebSockets.
"""
import json
import redis
from celery import Celery
from datetime import datetime

from app.config import settings
from app.database import SessionLocal
from app.models.analysis import Analysis
from app.ml_interface.pipeline_gateway import PipelineGateway
from app.services.report_service import ReportService
from app.services.model_monitoring import ModelMonitor

# ─── Celery App Configuration ──────────────────────────────────────────────────
celery_app = Celery('tasks', broker=settings.REDIS_URL, backend=settings.REDIS_URL)

# Configure Celery for production and priority queues
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    # Priority queues: higher number = higher priority
    broker_transport_options={
        'queue_order_strategy': 'priority',
    },
    task_routes={
        'app.tasks.analysis_task.run_analysis_pipeline': {'queue': 'celery'}
    }
)

# Optional: For local dev without Redis worker running, set to True.
# In production, this MUST be False.
celery_app.conf.task_always_eager = False

# ─── Redis Pub/Sub for WebSockets ─────────────────────────────────────────────
redis_client = redis.from_url(settings.REDIS_URL)

def publish_progress(job_id: str, status: str, progress: int, message: str):
    """Publish progress to Redis Pub/Sub so WebSockets can broadcast it."""
    try:
        data = {
            "job_id": job_id,
            "status": status,
            "progress": progress,
            "message": message
        }
        redis_client.publish("job_progress", json.dumps(data))
    except Exception as e:
        print(f"[WARN] Failed to publish progress to Redis: {e}")


# ─── Global ML Models (Loaded Once Per Worker) ────────────────────────────────
_models = {}

def get_models():
    """Get or load ML models into the Celery worker process."""
    if not _models:
        from ml.models.quality.inference import QualityInference
        from ml.models.vessel.inference import VesselInference
        from ml.models.av.inference import AVInference
        from ml.models.disease.inference import DiseaseInference
        
        _models['quality'] = QualityInference()
        _models['vessel'] = VesselInference()
        _models['av'] = AVInference()
        _models['disease'] = DiseaseInference()
        print("[OK] Models loaded in worker process")
    
    return _models


# ─── Celery Task ──────────────────────────────────────────────────────────────
@celery_app.task(bind=True, max_retries=3)
def run_analysis_pipeline(self, job_id: str, image_path: str, clinical_data: dict):
    """
    Run complete analysis pipeline via PipelineGateway.
    """
    db = SessionLocal()
    publish_progress(job_id, "processing", 10, "Initializing pipeline...")
    
    try:
        # Update DB status
        analysis = db.query(Analysis).filter(Analysis.job_id == job_id).first()
        if not analysis:
            print(f"[ERROR] Job {job_id} not found in DB")
            return
        
        analysis.status = "processing"
        db.commit()
        
        publish_progress(job_id, "processing", 20, "Loading ML models...")
        models = get_models()
        
        # Instantiate Gateway
        gateway = PipelineGateway(
            quality_model=models['quality'],
            vessel_model=models['vessel'],
            av_model=models['av'],
            disease_model=models['disease']
        )
        
        publish_progress(job_id, "processing", 40, "Running AI models...")
        
        # Run Pipeline
        result = gateway.run(image_path, clinical_data)
        
        # Check if failed
        if result.status == 'failed' or result.status == 'rejected_quality':
            analysis.status = result.status
            analysis.error_message = result.error or "Unknown failure"
            db.commit()
            publish_progress(job_id, result.status, 100, f"Analysis failed: {analysis.error_message}")
            return
        
        publish_progress(job_id, "processing", 80, "Processing results and saving artifacts...")
        
        # Save version metadata
        analysis.pipeline_version = result.pipeline_version
        analysis.quality_model_version = result.quality_model_version
        analysis.vessel_model_version = result.vessel_model_version
        analysis.av_model_version = result.av_model_version
        analysis.disease_model_version = result.disease_model_version
        analysis.risk_module_version = result.risk_module_version
        analysis.config_version = result.config_version
        
        visit = analysis.visit
        patient = visit.patient if visit else None
        org_id = patient.org_id if patient else 1

        # Log to model monitoring
        ModelMonitor.log_inference(result, org_id)
        
        # Save AI outputs
        if result.quality:
            analysis.quality_score = result.quality.get('quality_score')
            analysis.is_gradable = str(result.quality.get('is_gradable')).lower()
        
        if result.biomarkers:
            analysis.av_ratio = result.biomarkers.get('av_ratio')
            analysis.vessel_density = result.biomarkers.get('vessel_density')
            analysis.tortuosity = result.biomarkers.get('tortuosity')
            analysis.branching_angle = result.biomarkers.get('branching_angle')
        
        if result.disease:
            analysis.dr_grade = result.disease.get('dr_grade')
            analysis.dr_probability = result.disease.get('dr_probability')
            analysis.class_probabilities = result.disease.get('class_probabilities')
        
        if result.risk:
            analysis.risk_level = result.risk.get('risk_level')
            analysis.risk_confidence = result.risk.get('confidence')
            analysis.risk_reasons = result.risk.get('reasons')
        
        if result.mask_paths:
            analysis.vessel_mask_path = result.mask_paths.get('vessel_mask')
            analysis.artery_mask_path = result.mask_paths.get('artery_mask')
            analysis.vein_mask_path = result.mask_paths.get('vein_mask')
            analysis.av_overlay_path = result.mask_paths.get('av_overlay')
        
        # Generate Report
        publish_progress(job_id, "processing", 90, "Generating clinical report...")
        
        visit = analysis.visit
        patient = visit.patient
        
        patient_data = {
            'name': patient.name,
            'age': patient.age,
            'patient_id': patient.patient_id
        }
        visit_data = {
            'bp_systolic': visit.bp_systolic,
            'bp_diastolic': visit.bp_diastolic,
            'blood_sugar': visit.blood_sugar
        }
        
        report_path = ReportService.generate_report(
            {
                'job_id': job_id,
                'biomarkers': result.biomarkers,
                'disease': result.disease,
                'risk': result.risk
            },
            patient_data,
            visit_data
        )
        
        analysis.report_path = report_path
        analysis.status = 'completed'
        analysis.completed_at = datetime.utcnow()
        
        db.commit()
        
        publish_progress(job_id, "completed", 100, "Analysis completed successfully")
        print(f"[OK] Analysis {job_id} completed successfully")
        
    except Exception as e:
        print(f"[ERROR] Analysis {job_id} failed: {str(e)}")
        try:
            analysis = db.query(Analysis).filter(Analysis.job_id == job_id).first()
            if analysis:
                analysis.status = 'failed'
                analysis.error_message = str(e)
                db.commit()
        except Exception:
            pass
        publish_progress(job_id, "failed", 100, f"Error: {str(e)}")
        raise self.retry(exc=e, countdown=10)  # Auto-retry on transient errors
    
    finally:
        db.close()