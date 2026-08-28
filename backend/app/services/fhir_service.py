"""
FHIR Service — CardioRetina AI
Helps transform our internal DB models into standard HL7 FHIR R4 resources.
"""
from typing import List
from datetime import datetime

from app.models.patient import Patient
from app.models.visit import Visit
from app.models.analysis import Analysis


class FHIRService:
    @staticmethod
    def patient_to_fhir(patient: Patient) -> dict:
        """Convert internal Patient model to FHIR Patient resource."""
        resource = {
            "resourceType": "Patient",
            "id": patient.patient_id,
            "identifier": [
                {
                    "use": "usual",
                    "system": "http://cardioretina.ai/patients",
                    "value": patient.patient_id
                }
            ],
            "name": [
                {
                    "use": "official",
                    "text": patient.name
                }
            ],
            "gender": patient.gender.lower() if patient.gender else "unknown",
        }
        
        # Approximate birthdate from age if actual DOB is missing
        if patient.age:
            birth_year = datetime.utcnow().year - patient.age
            resource["birthDate"] = f"{birth_year}-01-01"
            
        return resource

    @staticmethod
    def visit_to_fhir_encounter(visit: Visit, patient: Patient) -> dict:
        """Convert internal Visit model to FHIR Encounter resource."""
        return {
            "resourceType": "Encounter",
            "id": visit.visit_id,
            "status": "finished",
            "class": {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "AMB",
                "display": "ambulatory"
            },
            "subject": {
                "reference": f"Patient/{patient.patient_id}"
            },
            "period": {
                "start": visit.visit_date.isoformat() + "Z" if visit.visit_date else None
            }
        }

    @staticmethod
    def analysis_to_fhir_diagnostic_report(analysis: Analysis, patient: Patient, visit: Visit) -> dict:
        """Convert internal Analysis result to FHIR DiagnosticReport resource."""
        report = {
            "resourceType": "DiagnosticReport",
            "id": analysis.job_id,
            "status": "final" if analysis.status == "completed" else "registered",
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "71485-6",
                        "display": "Fundus photography"
                    }
                ]
            },
            "subject": {
                "reference": f"Patient/{patient.patient_id}"
            },
            "encounter": {
                "reference": f"Encounter/{visit.visit_id}"
            },
            "issued": analysis.completed_at.isoformat() + "Z" if analysis.completed_at else None,
            "result": []  # List of Observation references
        }
        
        if analysis.status == "completed":
            report["conclusion"] = f"Diabetic Retinopathy Grade: {analysis.dr_grade}. CVD Risk Level: {analysis.risk_level}."
            
        return report

    @staticmethod
    def create_observation(analysis: Analysis, patient: Patient, code: str, display: str, value, unit=None) -> dict:
        """Create a single FHIR Observation resource for a biomarker."""
        obs = {
            "resourceType": "Observation",
            "id": f"obs-{analysis.job_id}-{code}",
            "status": "final",
            "code": {
                "coding": [
                    {
                        "system": "http://cardioretina.ai/biomarkers",
                        "code": code,
                        "display": display
                    }
                ]
            },
            "subject": {
                "reference": f"Patient/{patient.patient_id}"
            }
        }
        
        if isinstance(value, float) or isinstance(value, int):
            obs["valueQuantity"] = {
                "value": value,
                "unit": unit or ""
            }
        else:
            obs["valueString"] = str(value)
            
        return obs

    @staticmethod
    def analysis_to_fhir_bundle(analysis: Analysis, patient: Patient, visit: Visit) -> dict:
        """Create a complete FHIR Bundle containing Patient, Encounter, Report, and Observations."""
        entries = []
        
        entries.append({"resource": FHIRService.patient_to_fhir(patient)})
        entries.append({"resource": FHIRService.visit_to_fhir_encounter(visit, patient)})
        
        report = FHIRService.analysis_to_fhir_diagnostic_report(analysis, patient, visit)
        
        if analysis.status == "completed":
            observations = []
            if analysis.av_ratio is not None:
                observations.append(FHIRService.create_observation(analysis, patient, "av_ratio", "A/V Ratio", analysis.av_ratio))
            if analysis.vessel_density is not None:
                observations.append(FHIRService.create_observation(analysis, patient, "vessel_density", "Vessel Density", analysis.vessel_density, "%"))
            if analysis.dr_grade is not None:
                observations.append(FHIRService.create_observation(analysis, patient, "dr_grade", "DR Grade", analysis.dr_grade))
            if analysis.risk_level is not None:
                observations.append(FHIRService.create_observation(analysis, patient, "cvd_risk", "CVD Risk Level", analysis.risk_level))
                
            for obs in observations:
                entries.append({"resource": obs})
                report["result"].append({"reference": f"Observation/{obs['id']}"})
                
        entries.append({"resource": report})
        
        return {
            "resourceType": "Bundle",
            "type": "collection",
            "entry": entries
        }
