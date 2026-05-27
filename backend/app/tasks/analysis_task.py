from celery import Celery
from app.config import settings
from app.database import SessionLocal
from app.models.analysis import Analysis
from ml.pipeline.main_pipeline import MainPipeline
from app.services.report_service import ReportService
from datetime import datetime

# Initialize Celery
celery_app = Celery('tasks', broker=settings.REDIS_URL, backend=settings.REDIS_URL)

# ADD THESE TWO LINES FOR NOW:
# This forces tasks to run immediately in the same process without needing Redis
celery_app.conf.task_always_eager = True
celery_app.conf.task_eager_propagates = True


# Global models (loaded once)
_models = {}

def get_models():
    """Get or load models"""
    if not _models:
        from ml.models.quality.inference import QualityInference
        from ml.models.vessel.inference import VesselInference
        from ml.models.av.inference import AVInference
        from ml.models.disease.inference import DiseaseInference
        
        _models['quality'] = QualityInference()
        _models['vessel'] = VesselInference()
        _models['av'] = AVInference()
        _models['disease'] = DiseaseInference()
        print("✅ Models loaded in worker")
    
    return _models

@celery_app.task(bind=True)
def run_analysis_pipeline(self, job_id, image_path, clinical_data):
    """
    Run complete analysis pipeline
    
    Args:
        job_id: unique job identifier
        image_path: path to uploaded image
        clinical_data: dict with patient clinical data
    """
    db = SessionLocal()
    
    try:
        # Update status
        analysis = db.query(Analysis).filter(Analysis.job_id == job_id).first()
        analysis.status = "processing"
        db.commit()
        
        # Get models
        models = get_models()
        
        # Create pipeline
        pipeline = MainPipeline(
            quality_model=models['quality'],
            vessel_model=models['vessel'],
            av_model=models['av'],
            disease_model=models['disease']
        )
        
        # Run pipeline
        results = pipeline.run(image_path, clinical_data)
        
        # Check if failed
        if results['status'] == 'failed':
            analysis.status = 'failed'
            analysis.error_message = results.get('error', 'Unknown error')
            db.commit()
            return
        
        # Update database with results
        if results.get('quality'):
            analysis.quality_score = results['quality']['quality_score']
            analysis.is_gradable = str(results['quality']['is_gradable']).lower()
        
        if results.get('biomarkers'):
            bio = results['biomarkers']
            analysis.av_ratio = bio.get('av_ratio')
            analysis.vessel_density = bio.get('vessel_density')
            analysis.tortuosity = bio.get('tortuosity')
            analysis.branching_angle = bio.get('branching_angle')
        
        if results.get('disease'):
            dis = results['disease']
            analysis.dr_grade = dis.get('dr_grade')
            analysis.dr_probability = dis.get('dr_probability')
            analysis.class_probabilities = dis.get('class_probabilities')
        
        if results.get('risk'):
            risk = results['risk']
            analysis.risk_level = risk.get('risk_level')
            analysis.risk_confidence = risk.get('confidence')
            analysis.risk_reasons = risk.get('reasons')
        
        if results.get('mask_paths'):
            masks = results['mask_paths']
            analysis.vessel_mask_path = masks.get('vessel_mask')
            analysis.artery_mask_path = masks.get('artery_mask')
            analysis.vein_mask_path = masks.get('vein_mask')
        
        # Generate report
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
                'biomarkers': results.get('biomarkers'),
                'disease': results.get('disease'),
                'risk': results.get('risk')
            },
            patient_data,
            visit_data
        )
        
        analysis.report_path = report_path
        analysis.status = 'completed'
        analysis.completed_at = datetime.utcnow()
        
        db.commit()
        
        print(f"✅ Analysis {job_id} completed successfully")
        
    except Exception as e:
        print(f"❌ Analysis {job_id} failed: {str(e)}")
        analysis = db.query(Analysis).filter(Analysis.job_id == job_id).first()
        analysis.status = 'failed'
        analysis.error_message = str(e)
        db.commit()
        raise
    
    finally:
        db.close()