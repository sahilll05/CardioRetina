"""
CDS Hooks API — CardioRetina AI
Provides clinical decision support integration into EHR workflows (e.g., Epic, Cerner).
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

router = APIRouter()

class CDSHookRequest(BaseModel):
    hook: str
    hookInstance: str
    fhirServer: str = None
    fhirAuthorization: Dict[str, Any] = None
    context: Dict[str, Any]
    prefetch: Dict[str, Any] = None


@router.get("/cds-services")
async def discovery():
    """Discovery endpoint for CDS Hooks."""
    return {
        "services": [
            {
                "hook": "patient-view",
                "id": "cardioretina-cvd-risk",
                "title": "CardioRetina CVD Risk Assessment",
                "description": "Evaluates patient for cardiovascular risk using retinal imaging AI if recent fundus photo exists.",
                "prefetch": {
                    "patient": "Patient/{{context.patientId}}",
                    "diagnostic_reports": "DiagnosticReport?patient={{context.patientId}}&code=71485-6"
                }
            }
        ]
    }


@router.post("/cds-services/cardioretina-cvd-risk")
async def cvd_risk_service(request: CDSHookRequest):
    """
    Service endpoint invoked by the EHR during the 'patient-view' hook.
    Analyzes prefetch data to provide cards.
    """
    if request.hook != "patient-view":
        raise HTTPException(status_code=400, detail="Unsupported hook")

    patient_id = request.context.get("patientId")
    if not patient_id:
        raise HTTPException(status_code=400, detail="Missing patientId in context")

    # In a real implementation, we would extract the latest DiagnosticReport from prefetch.
    # If a recent high-risk result exists, we generate a warning card.
    # If no recent fundus photo exists, we generate an information card suggesting one.
    
    # Placeholder logic
    has_recent_scan = False
    if request.prefetch and "diagnostic_reports" in request.prefetch:
        reports = request.prefetch["diagnostic_reports"].get("entry", [])
        if reports:
            has_recent_scan = True
            
    cards = []
    
    if has_recent_scan:
        # Assuming we found a high risk result
        cards.append({
            "summary": "High Cardiovascular Risk Detected",
            "indicator": "warning",
            "source": {
                "label": "CardioRetina AI"
            },
            "detail": "Recent retinal analysis indicates a high risk of CVD. Consider cardiology referral.",
            "links": [
                {
                    "label": "View Full Report",
                    "url": f"https://app.cardioretina.ai/reports/{patient_id}",
                    "type": "absolute"
                }
            ]
        })
    else:
        cards.append({
            "summary": "Consider Retinal Screening",
            "indicator": "info",
            "source": {
                "label": "CardioRetina AI"
            },
            "detail": "Patient has no recent fundus photography on record. AI screening can assess early CVD risk.",
        })

    return {"cards": cards}
