"""
Unified Ingestion Service — CardioRetina AI
All ingestion paths (DICOMweb, legacy DICOM upload, hot-folder, C-STORE SCP)
must call `process_dicom_ingestion`. This ensures a single pipeline for creating
Patient, Visit, Analysis records and dispatching the Celery task.
"""
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.analysis import Analysis
from app.core.dicom_parser import parse_dicom_bytes, parse_dicom_file, save_rgb_as_png
from app.tasks.analysis_task import run_analysis_pipeline


async def process_dicom_ingestion(
    db: AsyncSession,
    dicom_bytes: bytes,
    org_id: int,
    source: str,
    original_filename: str = "unknown.dcm",
) -> dict:
    """
    Process a DICOM file from raw bytes.
    1. Parse DICOM metadata and pixel array.
    2. Save pixel array as PNG.
    3. Create/update Patient and Visit.
    4. Create Analysis record.
    5. Dispatch Celery task.
    """
    # 1. Parse DICOM
    pixel_array, metadata = parse_dicom_bytes(dicom_bytes)
    
    # Generate unique IDs
    job_id = f"JOB-{uuid.uuid4().hex[:12].upper()}"
    
    # 2. Save as PNG
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    png_filename = f"{job_id}_{original_filename}.png"
    png_path = os.path.join(settings.UPLOAD_DIR, png_filename)
    save_rgb_as_png(pixel_array, png_path)

    # 3. Create/Update Patient & Visit
    # Extract patient info, fallback to placeholders if missing
    p_id = metadata.patient_id or f"UNK-{uuid.uuid4().hex[:6].upper()}"
    p_name = metadata.patient_name or "Unknown Patient"
    
    # Calculate age from birth date if possible, else default
    age = 50
    if metadata.patient_birth_date and len(metadata.patient_birth_date) == 8:
        try:
            birth_year = int(metadata.patient_birth_date[:4])
            current_year = datetime.utcnow().year
            age = current_year - birth_year
        except ValueError:
            pass

    # Find existing patient or create
    result = await db.execute(
        select(Patient).where(Patient.patient_id == p_id, Patient.org_id == org_id)
    )
    patient = result.scalar_one_or_none()
    
    if not patient:
        patient = Patient(
            patient_id=p_id,
            org_id=org_id,
            name=p_name,
            age=age,
            gender=metadata.patient_sex,
        )
        db.add(patient)
        await db.commit()
        await db.refresh(patient)

    # Create a new visit for this scan (simplification: 1 scan = 1 visit for now)
    visit_id = f"VIS-{uuid.uuid4().hex[:8].upper()}"
    visit = Visit(
        visit_id=visit_id,
        patient_id=patient.id,
        visit_date=datetime.utcnow()
    )
    db.add(visit)
    await db.commit()
    await db.refresh(visit)

    # 4. Create Analysis Record
    analysis = Analysis(
        job_id=job_id,
        visit_id=visit.id,
        image_path=png_path,
        status="pending",
        ingestion_source=source,
        started_at=datetime.utcnow()
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    # 5. Dispatch Celery Task
    # Note: Celery tasks currently expect clinical_data dict.
    clinical_data = {
        "age": patient.age,
        "bp_systolic": visit.bp_systolic,
        "bp_diastolic": visit.bp_diastolic,
        "blood_sugar": visit.blood_sugar,
        "cholesterol": visit.cholesterol,
        "diabetes_history": patient.diabetes_history
    }
    
    # Determine queue based on some logic? (e.g. stat_queue vs routine_queue)
    # For now, default queue
    run_analysis_pipeline.delay(job_id, png_path, clinical_data)

    return {
        "job_id": job_id,
        "patient_id": patient.patient_id,
        "visit_id": visit.visit_id,
        "status": "processing",
        "source": source
    }


def process_dicom_ingestion_sync(
    db: Session,
    dicom_path: str,
    org_id: int,
    source: str,
) -> dict:
    """
    Sync version of process_dicom_ingestion, used by Watchdog and C-STORE SCP
    which run in separate threads outside the ASGI event loop.
    """
    # 1. Parse DICOM
    pixel_array, metadata = parse_dicom_file(dicom_path)
    
    # Generate unique IDs
    job_id = f"JOB-{uuid.uuid4().hex[:12].upper()}"
    original_filename = os.path.basename(dicom_path)
    
    # 2. Save as PNG
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    png_filename = f"{job_id}_{original_filename}.png"
    png_path = os.path.join(settings.UPLOAD_DIR, png_filename)
    save_rgb_as_png(pixel_array, png_path)

    # 3. Create/Update Patient & Visit
    p_id = metadata.patient_id or f"UNK-{uuid.uuid4().hex[:6].upper()}"
    p_name = metadata.patient_name or "Unknown Patient"
    
    age = 50
    if metadata.patient_birth_date and len(metadata.patient_birth_date) == 8:
        try:
            birth_year = int(metadata.patient_birth_date[:4])
            current_year = datetime.utcnow().year
            age = current_year - birth_year
        except ValueError:
            pass

    patient = db.query(Patient).filter(Patient.patient_id == p_id, Patient.org_id == org_id).first()
    
    if not patient:
        patient = Patient(
            patient_id=p_id,
            org_id=org_id,
            name=p_name,
            age=age,
            gender=metadata.patient_sex,
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    visit_id = f"VIS-{uuid.uuid4().hex[:8].upper()}"
    visit = Visit(
        visit_id=visit_id,
        patient_id=patient.id,
        visit_date=datetime.utcnow()
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)

    # 4. Create Analysis Record
    analysis = Analysis(
        job_id=job_id,
        visit_id=visit.id,
        image_path=png_path,
        status="pending",
        ingestion_source=source,
        started_at=datetime.utcnow()
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # 5. Dispatch Celery Task
    clinical_data = {
        "age": patient.age,
        "bp_systolic": visit.bp_systolic,
        "bp_diastolic": visit.bp_diastolic,
        "blood_sugar": visit.blood_sugar,
        "cholesterol": visit.cholesterol,
        "diabetes_history": patient.diabetes_history
    }
    
    run_analysis_pipeline.delay(job_id, png_path, clinical_data)

    return {
        "job_id": job_id,
        "patient_id": patient.patient_id,
        "visit_id": visit.visit_id,
        "status": "processing",
        "source": source
    }
