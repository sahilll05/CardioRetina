"""
DICOMweb API — CardioRetina AI
Cloud-native ingestion path implementing STOW-RS (Store), WADO-RS (Retrieve), and QIDO-RS (Query).
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.core.rbac import get_current_user
from app.services.ingestion_service import process_dicom_ingestion
from app.core.audit_chain import write_audit_log
from app.models.analysis import Analysis
from app.models.patient import Patient

router = APIRouter()


@router.post("/studies", status_code=202)
async def stow_rs_store_instances(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    STOW-RS: Store Instances
    Accepts multipart/related payload containing DICOM files.
    """
    content_type = request.headers.get("content-type", "")
    if "multipart/related" not in content_type:
        raise HTTPException(status_code=415, detail="Unsupported Media Type. Expected multipart/related.")

    # FastAPI's form data parsing handles multipart/related for file uploads
    try:
        form = await request.form()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse multipart request")

    results = []
    for field_name, file_item in form.items():
        if hasattr(file_item, "filename") and hasattr(file_item, "read"):
            content = await file_item.read()
            if not content:
                continue

            try:
                result = await process_dicom_ingestion(
                    db=db,
                    dicom_bytes=content,
                    org_id=current_user.org_id,
                    source="dicomweb_stow",
                    original_filename=file_item.filename or f"{uuid.uuid4().hex}.dcm"
                )
                results.append(result)
                
                await write_audit_log(
                    db, action="DICOMWEB_STOW", user_id=current_user.id, org_id=current_user.org_id,
                    resource=f"analysis:{result['job_id']}"
                )
            except Exception as e:
                # In a real STOW-RS, we'd build a detailed XML/JSON response showing success/failure per instance.
                # For this implementation, we simply fail the request if an instance fails.
                raise HTTPException(status_code=500, detail=f"Failed to process instance: {str(e)}")

    if not results:
        raise HTTPException(status_code=400, detail="No DICOM instances found in request")

    # STOW-RS typically returns a DICOM JSON response. We return a simplified JSON for now.
    return {"status": "Accepted", "instances_processed": len(results), "results": results}


@router.get("/studies")
async def qido_rs_search_studies(
    PatientID: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    QIDO-RS: Search for Studies
    Simplified implementation to query by PatientID.
    """
    if not PatientID:
        # Just return a subset for the org
        result = await db.execute(select(Patient).where(Patient.org_id == current_user.org_id).limit(50))
        patients = result.scalars().all()
    else:
        result = await db.execute(select(Patient).where(Patient.patient_id == PatientID, Patient.org_id == current_user.org_id))
        patients = result.scalars().all()

    # DICOM JSON representation is complex. Returning simplified JSON.
    return [{"PatientID": p.patient_id, "PatientName": p.name} for p in patients]


@router.get("/studies/{study_uid}/series/{series_uid}/instances/{instance_uid}")
async def wado_rs_retrieve_instance(
    study_uid: str,
    series_uid: str,
    instance_uid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    WADO-RS: Retrieve Instance
    Stub implementation. In a full system, this returns the raw DICOM file.
    """
    raise HTTPException(status_code=501, detail="WADO-RS Retrieve Instance not fully implemented")
