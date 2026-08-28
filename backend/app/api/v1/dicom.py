"""
Legacy DICOM Upload API — CardioRetina AI
Endpoint for uploading classic .dcm files via POST.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.core.rbac import get_current_user
from app.services.ingestion_service import process_dicom_ingestion
from app.core.audit_chain import write_audit_log

router = APIRouter()


@router.post("/upload", response_model=dict)
async def upload_dicom(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a DICOM file (.dcm) for analysis.
    Creates Patient, Visit, and Analysis records, and dispatches the ML task.
    """
    if not file.filename.lower().endswith('.dcm'):
        raise HTTPException(status_code=400, detail="File must be a DICOM (.dcm) file")

    content = await file.read()
    
    try:
        result = await process_dicom_ingestion(
            db=db,
            dicom_bytes=content,
            org_id=current_user.org_id,
            source="manual_upload",
            original_filename=file.filename
        )
        
        # Audit log
        await write_audit_log(
            db, action="DICOM_UPLOAD", user_id=current_user.id, org_id=current_user.org_id,
            resource=f"analysis:{result['job_id']}",
            details={"filename": file.filename}
        )
        
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process DICOM: {str(e)}")
