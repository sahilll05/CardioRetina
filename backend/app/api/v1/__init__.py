from fastapi import APIRouter
from app.api.v1 import patients, visits, analysis

api_router = APIRouter()

api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(visits.router, prefix="/visits", tags=["visits"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])