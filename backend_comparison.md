# CardioRetina AI — Documentation vs Actual Backend: Full Comparison

---

## ✅ What Matches the Documentation

### Framework & Language
| Item | Docs | Actual Code |
|---|---|---|
| Framework | FastAPI | ✅ FastAPI |
| Language | Python 3.10+ | ✅ Python |
| ORM | SQLAlchemy 2.0+ | ✅ SQLAlchemy 2.0+ |
| Database | PostgreSQL 14+ | ✅ PostgreSQL (`.env`: `postgresql://postgres:2005@localhost:5432/cardioretina`) |
| Migrations | Alembic | ✅ Alembic present (`alembic/` directory, `alembic.ini`) |
| Task Queue | Celery 5.3+ | ✅ Celery used (`analysis_task.py`) |
| Message Broker | Redis 7.0+ | ✅ Redis used (`.env`: `redis://localhost:6379/0`) |
| Web Server | Uvicorn (ASGI) | ✅ `uvicorn[standard]` in `requirements.txt` |
| PDF Generation | `reportlab` | ✅ `reportlab>=4.0.7` in requirements, `ReportService` uses it |

### Database Models (Schema)
All three tables described in the docs are implemented and match:

| Table | Docs Columns | Code Columns | Match? |
|---|---|---|---|
| `patients` | id, patient_id, name, age, gender, phone, email, diabetes_history, hypertension, created_at, updated_at | ✅ All present | ✅ |
| `visits` | id, visit_id, patient_id (FK), bp_systolic, bp_diastolic, blood_sugar, cholesterol, hba1c, visit_date, created_at | ✅ All present | ✅ |
| `analyses` | id, job_id, visit_id (FK), image_path, status, quality_score, is_gradable, av_ratio, vessel_density, tortuosity, branching_angle, dr_grade, dr_probability, class_probabilities, risk_level, risk_confidence, risk_reasons, report_path, vessel_mask_path, artery_mask_path, vein_mask_path, error_message, started_at, completed_at, created_at | ✅ All present | ✅ |

### AI Pipeline Steps
The docs describe an 8-step pipeline. The actual `MainPipeline.run()` implements **7 steps** (Step 4 "Mask Fusion" is handled inside `AVInference` rather than as a named pipeline step, but the logic is there):

| Step | Docs | Code | Match? |
|---|---|---|---|
| 1. Quality Check | MobileNetV3 | ✅ `QualityInference` → `QualityModel` (MobileNetV3) | ✅ |
| 2. Vessel Segmentation | U-Net++ | ✅ `VesselInference` → `UNetPlusPlus(out_channels=1)` | ✅ |
| 3. A/V Classification | U-Net++ (3-class) | ✅ `AVInference` → `AVModel` (inherits UNetPlusPlus, out_channels=3) | ✅ |
| 4. Mask Fusion | Logical AND of A/V with vessel mask | ✅ Done inside `AVInference.predict()` via `AVFusion.fuse_masks()` | ✅ |
| 5. Biomarker Extraction | AVR, density, tortuosity, branching angle | ✅ `BiomarkerExtractor.extract_all()` | ✅ |
| 6. Disease Screening | EfficientNet-B3 | ✅ `DiseaseInference` → `DiseaseModel` (EfficientNet-B3) | ✅ |
| 7. Risk Assessment | Score-based engine | ✅ `RiskEngine.calculate_risk()` | ✅ |
| 8. Report Generation | PDF report | ✅ `ReportService.generate_report()` | ✅ |

### Biomarker Calculations
All four algorithms in the docs are implemented exactly as described:

| Biomarker | Doc Algorithm | Code | Match? |
|---|---|---|---|
| A/V Ratio | Skeletonize → Distance transform → ratio of widths | ✅ `calculate_av_ratio()` | ✅ |
| Vessel Density | `vessel_pixels / total_pixels` | ✅ `calculate_vessel_density()` | ✅ |
| Tortuosity | `arc_length / chord_length` per contour | ✅ `calculate_tortuosity()` | ✅ |
| Branching Angle | HoughLines on branch point regions | ✅ `calculate_branching_angle()` | ✅ |

### Risk Engine Scoring
Matches documentation exactly:

| Factor | Doc Score | Code Score | Match? |
|---|---|---|---|
| AVR < 0.65 | +2 | +2 | ✅ |
| Tortuosity > 1.2 | +2 | +2 | ✅ |
| Vessel density < 0.05 | +1 | +1 | ✅ |
| DR Grade ≥ 2 | +3 | +3 | ✅ |
| DR Grade == 1 | +1 | +1 | ✅ |
| BP systolic > 140 | +2 | +2 | ✅ |
| Blood sugar > 140 | +2 | +2 | ✅ |
| Cholesterol > 200 | +1 | +1 | ✅ |
| Age > 60 | +1 | +1 | ✅ |
| Diabetes history | +2 | +2 | ✅ |
| LOW = 0–2, MODERATE = 3–6, HIGH = 7+ | ✅ | ✅ | ✅ |

### API Endpoints
| Route | Docs | Code | Match? |
|---|---|---|---|
| `POST /api/v1/patients/` | Create patient | ✅ | ✅ |
| `GET /api/v1/patients/{patient_id}` | Get patient | ✅ | ✅ |
| `GET /api/v1/patients/` | List patients | ✅ | ✅ |
| `PUT /api/v1/patients/{patient_id}` | Update patient | ✅ | ✅ |
| `DELETE /api/v1/patients/{patient_id}` | Delete patient | ✅ | ✅ |
| `POST /api/v1/visits/` | Create visit | ✅ | ✅ |
| `GET /api/v1/visits/{visit_id}` | Get visit | ✅ | ✅ |
| `GET /api/v1/visits/patient/{patient_id}` | List visits | ✅ | ✅ |
| `POST /api/v1/analysis/start` | Start analysis | ✅ | ✅ |
| `GET /api/v1/analysis/{job_id}` | Get result | ✅ | ✅ |

---

## ❌ What Is DIFFERENT from the Documentation

### 1. 🐳 No Docker / Docker Compose (As You Noted)
- **Docs say**: "Container: Docker + Docker Compose"
- **Reality**: No `Dockerfile`, no `docker-compose.yml` anywhere in the project. Everything runs directly on the host (native Python venv, local PostgreSQL, local Redis).

---

### 2. 🏗️ Quality Model: MobileNetV3-**Small** not MobileNetV3-**Large**
- **Docs say**: `MobileNetV3-Large`
- **Reality** ([model.py](file:///e:/Projects/others/medical/cardioretina-main/backend/ml/models/quality/model.py#L9)):
  ```python
  self.backbone = models.mobilenet_v3_small(pretrained=False)
  ```
  The comment even says: *"Using MobileNetV3 Small as per pretrained weights"*. The input features are `576` (Small), not `960` (Large).

---

### 3. 🧠 Quality Model Classifier Architecture
- **Docs say**: `Fully Connected (1280 → 2)` — single linear layer
- **Reality** ([model.py](file:///e:/Projects/others/medical/cardioretina-main/backend/ml/models/quality/model.py#L13)):
  ```python
  self.backbone.classifier[0] = nn.Linear(576, 128)
  self.backbone.classifier[3] = nn.Linear(128, num_classes)  # 128 → 2
  ```
  It is a **two-layer classifier** (576→128→2), not 1280→2.

---

### 4. 🧠 Disease Model Classifier Architecture
- **Docs say**: `Fully Connected (1536 → 5)` — a single linear layer
- **Reality** ([model.py](file:///e:/Projects/others/medical/cardioretina-main/backend/ml/models/disease/model.py#L12)):
  ```python
  self.backbone.classifier = nn.Sequential(
      nn.Dropout(p=0.3, inplace=True),
      nn.Linear(in_features, 256),
      nn.ReLU(),
      nn.Dropout(p=0.3),
      nn.Linear(256, num_classes)  # 256 → 5
  )
  ```
  A **multi-layer** classifier with Dropout + ReLU in between, not a single FC layer.

---

### 5. ⚙️ U-Net++ Filter Sizes (Smaller)
- **Docs say**: encoder filters `[64, 128, 256, 512, 1024]`
- **Reality** ([vessel/model.py](file:///e:/Projects/others/medical/cardioretina-main/backend/ml/models/vessel/model.py#L24)):
  ```python
  filters = [32, 64, 128, 256, 512]
  ```
  The model is **half the width** described in the docs — a lighter model.

---

### 6. 🔄 Celery Is Running in "Always Eager" Mode (No Real Queue)
- **Docs say**: "Task Queue (Celery): Redis Broker + Worker Pool — Async Analysis Pipeline Execution"
- **Reality** ([analysis_task.py](file:///e:/Projects/others/medical/cardioretina-main/backend/app/tasks/analysis_task.py#L14)):
  ```python
  celery_app.conf.task_always_eager = True
  celery_app.conf.task_eager_propagates = True
  ```
  `task_always_eager = True` means **tasks run synchronously in the same process**. There is no real async worker pool — the Celery worker process is bypassed entirely. The comment in the code even says: *"This forces tasks to run immediately in the same process without needing Redis"*.

---

### 7. 📋 Pipeline Step Count: 7 vs 8
- **Docs say**: 8 pipeline steps (Step 4 = "Mask Fusion" as a separate stage)
- **Reality**: `MainPipeline.run()` has **7 explicit steps**. Mask fusion is absorbed inside `AVInference.predict()` via `AVFusion.fuse_masks()`, not a named step in the pipeline.

---

### 8. 🔒 No Authentication / Hypertension Risk Factor
- **Docs say**: Clinical risk factor includes "Hypertension: +2 points"
- **Reality** ([risk_engine.py](file:///e:/Projects/others/medical/cardioretina-main/backend/ml/risk/risk_engine.py)): There is **no check for `hypertension` flag** from patient history. Only `diabetes_history` is checked. Hypertension is indirectly covered by BP systolic > 140, but the dedicated `hypertension` boolean field from the `Patient` model is never used in risk scoring.

---

### 9. 🔐 Auth/JWT Code Exists But Is Not Wired
- **Docs say**: Security (JWT, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES)
- **Reality**: `requirements.txt` includes `python-jose[cryptography]` and `passlib[bcrypt]`, and `.env` defines `SECRET_KEY`/`ALGORITHM`. However, **no auth middleware, no login endpoint, no token verification** exists in any route. All endpoints are fully open.

---

### 10. 🛠️ No Nginx, No CI/CD, No Monitoring Stack
- **Docs say**: Reverse Proxy: Nginx, CI/CD: GitHub Actions, Monitoring: Prometheus + Grafana, Logging: ELK Stack
- **Reality**: None of these exist in the project. There is no `nginx.conf`, no `.github/workflows/`, no Prometheus config, no ELK setup.

---

### 11. 📦 Missing from Requirements
- **Docs list**: `SciPy`, `scikit-image` — ✅ both present
- **Docs say `react-pdf`** for frontend PDF viewing — frontend not checked here
- **No `matplotlib`** in docs but it **is** in `requirements.txt` (used internally, probably for mask visualization)

---

## Summary Table

| Area | Docs | Reality | Status |
|---|---|---|---|
| Framework (FastAPI, SQLAlchemy, Alembic, Celery) | ✅ | ✅ | **SAME** |
| Database schema (all 3 tables, all columns) | ✅ | ✅ | **SAME** |
| AI pipeline (4 models, 7-8 steps) | ✅ | ✅ | **SAME** |
| Biomarker algorithms | ✅ | ✅ | **SAME** |
| Risk scoring logic | ✅ | ✅ | **SAME** |
| API routes | ✅ | ✅ | **SAME** |
| Docker / Docker Compose | ✅ | ❌ Not present | **DIFFERENT** |
| MobileNetV3 variant | Large | **Small** | **DIFFERENT** |
| Quality classifier layers | 1280→2 (1 layer) | 576→128→2 (2 layers) | **DIFFERENT** |
| Disease classifier | 1536→5 (1 layer) | in_features→256→5 + Dropout | **DIFFERENT** |
| U-Net++ filter sizes | [64,128,256,512,1024] | **[32,64,128,256,512]** | **DIFFERENT** |
| Celery async execution | Real worker pool | **task_always_eager=True** (synchronous) | **DIFFERENT** |
| Hypertension risk factor | +2 (separate flag) | **Not implemented** | **DIFFERENT** |
| Authentication (JWT) | Described | **Installed but not implemented** | **DIFFERENT** |
| Nginx / CI/CD / Monitoring | Described | **None present** | **DIFFERENT** |
