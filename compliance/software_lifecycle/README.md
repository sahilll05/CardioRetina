# Compliance — Software Lifecycle (IEC 62304)

> **Purpose**: IEC 62304 software lifecycle artifacts for CardioRetina AI.
> Covers software safety classification, verification and validation plans, and anomaly reporting.

## Contents

| File / Subfolder | Description |
|---|---|
| `software_safety_classification.md` | IEC 62304 class assignment for each software unit |
| `verification_plan.md` | Unit test, integration test, and system test plan |
| `validation_plan.md` | Clinical validation protocol references |
| `anomaly_log.md` | Active software problem report log |

## Software Safety Classifications (Preliminary)

| Component | IEC 62304 Class | Rationale |
|---|---|---|
| `ml/pipeline/main_pipeline.py` | **Class C** | Failure could cause serious injury (wrong CVD risk score → missed high-risk patient) |
| `ml/risk/risk_engine.py` | **Class C** | Direct clinical decision-support output |
| `ml/models/disease/` | **Class C** | DR grading failure could delay treatment of Grade 3/4 DR |
| `ml/models/quality/` | **Class B** | Failure causes pipeline rejection, not wrong clinical output |
| `ml/features/biomarkers.py` | **Class C** | Biomarker errors propagate to risk engine |
| `app/api/v1/*.py` (non-clinical) | **Class A** | No direct patient safety impact |
| `app/services/ingestion_watcher.py` | **Class B** | Failure causes missed scan, not wrong result |

## Status

🟡 **Scaffolding — To be reviewed by a qualified IEC 62304 assessor.**
