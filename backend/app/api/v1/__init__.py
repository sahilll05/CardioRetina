from fastapi import APIRouter
from app.api.v1 import patients, visits, analysis, auth, dicom, dicomweb, websockets, smart_fhir, cds_hooks

api_router = APIRouter()

# Existing routes (preserved — backward compatibility guaranteed)
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(visits.router, prefix="/visits", tags=["visits"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])

# New routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dicom.router, prefix="/dicom", tags=["dicom_legacy"])
api_router.include_router(dicomweb.router, prefix="/dicomweb", tags=["dicomweb"])
api_router.include_router(websockets.router, prefix="/ws", tags=["websockets"])
api_router.include_router(smart_fhir.router, prefix="/fhir", tags=["fhir"])
api_router.include_router(cds_hooks.router, prefix="/cds", tags=["cds_hooks"])