<div align="center">

# 🫀 CardioRetina AI

### AI-Powered Cardiovascular Risk Assessment from Retinal Fundus Images

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.6%2B-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)

> **🎉 Project Status: 100% Completed** — All core phases, security audits, and ML pipelines are finalized. Models successfully trained on NVIDIA RTX 4060 GPU via CUDA 12.1.

<br/>

> **The human retina is the only place in the body where blood vessels can be directly observed non-invasively.**
> CardioRetina AI exploits this window to assess cardiovascular disease risk and detect diabetic retinopathy — in under 5 minutes, with no blood draws.

<br/>

```
INPUT:  Retinal Fundus Image + Patient Clinical Data
           ↓
AI:     4-Model Deep Learning Pipeline
           ↓
OUTPUT: • Cardiovascular Risk Score  (LOW / MODERATE / HIGH)
        • Diabetic Retinopathy Grade (0–4)
        • Retinal Biomarkers         (A/V ratio, tortuosity, density…)
        • Clinical PDF Report
```

</div>

---

## 📋 Table of Contents

- [Medical Background](#-medical-background)
- [System Architecture](#-system-architecture)
- [AI Pipeline](#-ai-pipeline)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Model Weights](#-model-weights)
- [Screenshots](#-screenshots)

---

## 🏥 Medical Background

### Why the Retina?

The retinal microvasculature shares the same embryonic origin as coronary and cerebral vessels. Changes visible in retinal blood vessels mirror what is happening throughout the entire cardiovascular system — often **years before symptoms appear**.

### What We Detect

| Biomarker | Normal Range | Clinical Significance |
|---|---|---|
| **A/V Ratio (AVR)** | 0.65 – 0.80 | Low AVR → narrowed arteries → hypertension / atherosclerosis |
| **Vessel Tortuosity** | 1.0 – 1.2 | High → diabetic or hypertensive retinopathy |
| **Vessel Density** | 10% – 15% | Low → vessel loss / ischemia; High → neovascularization |
| **Branching Angle** | 85° – 95° | Abnormal → vascular remodeling |

### Diabetic Retinopathy Grading (0–4)

```
Grade 0 → No DR              (routine annual screening)
Grade 1 → Mild NPDR          (6–12 month follow-up)
Grade 2 → Moderate NPDR      (3–6 month follow-up)
Grade 3 → Severe NPDR        (immediate retinal specialist referral)
Grade 4 → Proliferative DR   (URGENT — risk of blindness)
```

### Time & Cost Comparison

| Method | Time | Cost | Invasive? |
|---|---|---|---|
| Traditional (blood tests → ECG → stress test) | Days–Weeks | $500–$5,000+ | Yes |
| **CardioRetina AI** | **~5 minutes** | **$50–$200** | **No** |

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────┐
│              FRONTEND  (React + Vite)                │
│  Dashboard │ Patients │ Analysis │ Reports           │
└─────────────────────────┬────────────────────────────┘
                          │  REST API (JSON)
┌─────────────────────────▼────────────────────────────┐
│              BACKEND  (FastAPI + Python)              │
│  /api/v1/patients  │  /api/v1/visits  │  /api/v1/analysis │
└─────────────────────────┬────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│           AI PIPELINE  (PyTorch + OpenCV)            │
│  Quality → Vessel Seg → A/V Class → Biomarkers       │
│  → Disease Screen → Risk Engine → PDF Report         │
└─────────────────────────┬────────────────────────────┘
                          │
          ┌───────────────┴──────────────┐
          ▼                              ▼
┌─────────────────┐           ┌──────────────────────┐
│   PostgreSQL    │           │    Local File System  │
│  (patients,     │           │  uploads/  reports/   │
│   visits,       │           │  (images, masks, PDFs)│
│   analyses)     │           └──────────────────────┘
└─────────────────┘
```

---

## 🤖 AI Pipeline

The pipeline runs sequentially through **7 steps** for every uploaded retinal image:

```
Image In
   │
   ▼  Step 1 ──── Quality Check (MobileNetV3-Small)
   │               Is image gradable? → If NO: reject with feedback
   │
   ▼  Step 2 ──── Vessel Segmentation (U-Net++)
   │               Binary mask of all blood vessels
   │
   ▼  Step 3 ──── A/V Classification (U-Net++ 3-class)
   │               Separate arteries vs veins
   │               + mask fusion (logical AND with vessel mask)
   │
   ▼  Step 4 ──── Biomarker Extraction
   │               • A/V Ratio  (skeletonize → distance transform)
   │               • Vessel Density  (vessel_pixels / total_pixels)
   │               • Tortuosity  (arc_length / chord_length)
   │               • Branching Angle  (HoughLines on branch points)
   │
   ▼  Step 5 ──── Disease Screening (EfficientNet-B3)
   │               DR Grade 0–4 + per-class probabilities
   │
   ▼  Step 6 ──── Cardiovascular Risk Engine
   │               Combines biomarkers + DR grade + clinical data
   │               → LOW / MODERATE / HIGH risk score
   │
   ▼  Step 7 ──── PDF Report Generation (ReportLab)
                  Saves masks (.png) + report (.pdf)
```

### Model Details

| Model | Architecture | Input Size | Output | Weight File |
|---|---|---|---|---|
| Quality | MobileNetV3-Small (2-class) | 224 × 224 | Gradable probability | `quality_net.pth` (~4 MB) |
| Vessel Segmentation | U-Net++ (filters: 32→512) | 512 × 512 | Binary vessel mask | `vessel_seg.pth` (~35 MB) |
| A/V Classification | U-Net++ 3-class (shared arch) | 512 × 512 | Artery / vein masks | `av_classify.pth` (~35 MB) |
| Disease Screening | EfficientNet-B3 (5-class) | 300 × 300 | DR grade 0–4 | `disease_screen.pth` (~43 MB) |

### Risk Scoring Logic

```
Biomarker Factors:           Clinical Factors:
  AVR < 0.65       → +2       BP systolic > 140   → +2
  Tortuosity > 1.2 → +2       Blood sugar > 140   → +2
  Density < 0.05   → +1       Cholesterol > 200   → +1
                               Age > 60            → +1
Disease Factors:               Diabetes history    → +2
  DR Grade ≥ 2     → +3
  DR Grade == 1    → +1

Score 0–2  → LOW RISK      (routine annual follow-up)
Score 3–6  → MODERATE RISK (semi-annual monitoring)
Score 7+   → HIGH RISK     (immediate cardiology referral)
```

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Web Framework | FastAPI 0.104+ |
| Language | Python 3.10+ |
| ORM | SQLAlchemy 2.0+ |
| Database | PostgreSQL 14+ |
| Migrations | Alembic |
| Task Queue | Celery 5.3+ (`task_always_eager=True` — synchronous mode) |
| Message Broker | Redis 7.0+ |
| Web Server | Uvicorn (ASGI) |
| PDF Generation | ReportLab 4.0+ |

### AI / ML
| Library | Version | Purpose |
|---|---|---|
| PyTorch | 2.6+ | Deep learning inference |
| TorchVision | 0.21+ | Model architectures (MobileNetV3, EfficientNet) |
| OpenCV | 4.8+ | Image preprocessing, contour analysis |
| scikit-image | 0.22+ | Skeletonization |
| SciPy | 1.11+ | Distance transforms |
| NumPy | 1.26+ | Numerical operations |
| Pillow | 10.1+ | Image I/O |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Build tool |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui + Radix UI | — | Component library |
| Framer Motion | 12 | Animations |
| Zustand | 5 | Global state |
| React Query (Axios) | — | API calls |
| Recharts | 3 | Data visualization |
| react-pdf | 10 | PDF viewer |
| React Hook Form + Zod | — | Forms & validation |

---

## 📁 Project Structure

```
cardioretina-main/
│
├── backend/
│   ├── .env                        # Environment variables (DATABASE_URL, REDIS_URL…)
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/                    # Database migration scripts
│   │
│   ├── app/
│   │   ├── main.py                 # FastAPI app, startup model loading
│   │   ├── config.py               # Settings via pydantic-settings
│   │   ├── database.py             # SQLAlchemy engine + session
│   │   │
│   │   ├── api/v1/
│   │   │   ├── patients.py         # CRUD: Patient management
│   │   │   ├── visits.py           # CRUD: Clinical visit management
│   │   │   └── analysis.py         # POST /start, GET /{job_id}
│   │   │
│   │   ├── models/
│   │   │   ├── patient.py          # SQLAlchemy: patients table
│   │   │   ├── visit.py            # SQLAlchemy: visits table
│   │   │   └── analysis.py         # SQLAlchemy: analyses table
│   │   │
│   │   ├── schemas/                # Pydantic request/response models
│   │   │
│   │   ├── services/
│   │   │   └── report_service.py   # PDF generation with ReportLab
│   │   │
│   │   └── tasks/
│   │       └── analysis_task.py    # Celery task: orchestrates pipeline
│   │
│   ├── ml/
│   │   ├── pipeline/
│   │   │   └── main_pipeline.py    # MainPipeline: 7-step orchestrator
│   │   │
│   │   ├── models/
│   │   │   ├── quality/            # MobileNetV3 quality checker
│   │   │   │   ├── model.py
│   │   │   │   ├── preprocess.py
│   │   │   │   └── inference.py
│   │   │   ├── vessel/             # U-Net++ vessel segmentation
│   │   │   │   ├── model.py
│   │   │   │   ├── postprocess.py
│   │   │   │   └── inference.py
│   │   │   ├── av/                 # U-Net++ artery/vein classification
│   │   │   │   ├── model.py        #   (inherits UNetPlusPlus, 3 output channels)
│   │   │   │   ├── fusion.py       #   mask fusion logic
│   │   │   │   └── inference.py
│   │   │   └── disease/            # EfficientNet-B3 DR grading
│   │   │       ├── model.py
│   │   │       ├── preprocess.py
│   │   │       └── inference.py
│   │   │
│   │   ├── features/
│   │   │   └── biomarkers.py       # AVR, density, tortuosity, branching angle
│   │   │
│   │   ├── risk/
│   │   │   └── risk_engine.py      # Score-based cardiovascular risk calculator
│   │   │
│   │   └── weights/                # Pre-trained .pth model files (not in git)
│   │       ├── quality_net.pth     #   ~4 MB
│   │       ├── vessel_seg.pth      #   ~35 MB
│   │       ├── av_classify.pth     #   ~35 MB
│   │       └── disease_screen.pth  #   ~43 MB
│   │
│   ├── uploads/                    # Uploaded images + generated masks
│   └── reports/                    # Generated PDF reports
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx
        ├── pages/
        │   ├── Dashboard.tsx       # Overview + stats
        │   ├── Patients/           # Patient management UI
        │   ├── Analysis/           # Upload + result viewer
        │   ├── Reports/            # PDF report viewer
        │   └── Settings/
        ├── components/             # Reusable UI components
        ├── stores/                 # Zustand global state
        ├── hooks/                  # Custom React hooks
        └── types/                  # TypeScript type definitions
```

---

## 🗄 Database Schema

```
patients
├── id              (PK)
├── patient_id      (UK, e.g. "PAT-A1B2C3D4")
├── name, age, gender, phone, email
├── diabetes_history (bool)
├── hypertension     (bool)
└── created_at, updated_at

visits
├── id              (PK)
├── visit_id        (UK, e.g. "VIS-X1Y2Z3A4")
├── patient_id      (FK → patients.id)
├── bp_systolic, bp_diastolic, blood_sugar, cholesterol, hba1c
└── visit_date, created_at

analyses
├── id              (PK)
├── job_id          (UK, e.g. "JOB-XXXXXXXXXXXX")
├── visit_id        (FK → visits.id)
├── image_path, status  (pending|processing|completed|failed)
├── quality_score, is_gradable
├── av_ratio, vessel_density, tortuosity, branching_angle
├── dr_grade, dr_probability, class_probabilities (JSON)
├── risk_level, risk_confidence, risk_reasons (JSON)
├── report_path, vessel_mask_path, artery_mask_path, vein_mask_path
├── error_message
└── started_at, completed_at, created_at
```

---

## 📡 API Reference

Base URL: `http://localhost:8000/api/v1`

### Patients

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/patients/` | Create a new patient |
| `GET` | `/patients/` | List all patients |
| `GET` | `/patients/{patient_id}` | Get patient by ID |
| `PUT` | `/patients/{patient_id}` | Update patient record |
| `DELETE` | `/patients/{patient_id}` | Delete patient |

### Visits

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/visits/` | Create a clinical visit (attach clinical data) |
| `GET` | `/visits/{visit_id}` | Get visit by ID |
| `GET` | `/visits/patient/{patient_id}` | List all visits for a patient |

### Analysis

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analysis/start` | Upload retinal image + clinical data → returns `job_id` |
| `GET` | `/analysis/{job_id}` | Poll analysis status / retrieve full results |

#### Example: Start Analysis (`multipart/form-data`)

```bash
curl -X POST http://localhost:8000/api/v1/analysis/start \
  -F "patient_id=PAT-A1B2C3D4" \
  -F "visit_id=VIS-X1Y2Z3A4" \
  -F "age=55" \
  -F "bp_systolic=145" \
  -F "blood_sugar=160" \
  -F "diabetes_history=true" \
  -F "image=@retinal_fundus.jpg"
```

#### Example Response

```json
{
  "job_id": "JOB-4F9E2A1B3C7D",
  "status": "processing"
}
```

#### Example: Get Results

```bash
curl http://localhost:8000/api/v1/analysis/JOB-4F9E2A1B3C7D
```

```json
{
  "job_id": "JOB-4F9E2A1B3C7D",
  "status": "completed",
  "results": {
    "quality":    { "quality_score": 0.94, "is_gradable": true },
    "biomarkers": { "av_ratio": 0.61, "vessel_density": 0.11, "tortuosity": 1.31, "branching_angle": 88.4 },
    "disease":    { "dr_grade": 2, "dr_probability": 0.78, "class_probabilities": [...] },
    "risk":       { "risk_level": "HIGH", "confidence": 0.90, "risk_score": 9, "reasons": [...] },
    "report_url": "/reports/report_JOB-4F9E2A1B3C7D_20260604_123456.pdf"
  }
}
```

Interactive Swagger docs available at: `http://localhost:8000/docs`

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 7.0+

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/your-username/cardioretina.git
cd cardioretina/backend
```

**2. Create and activate virtual environment**
```bash
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL and Redis connection details
```

**5. Create the database**
```sql
-- In psql:
CREATE DATABASE cardioretina;
```

**6. Run database migrations**
```bash
alembic upgrade head
```

**7. Place model weights**

Download the four `.pth` files (see [Model Weights](#-model-weights)) and place them in:
```
backend/ml/weights/
├── quality_net.pth
├── vessel_seg.pth
├── av_classify.pth
└── disease_screen.pth
```

**8. Start the backend server**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API will be live at `http://localhost:8000`
Swagger UI at `http://localhost:8000/docs`

> **Note:** The analysis pipeline runs synchronously in the same FastAPI process (no separate Celery worker needed). When you call `/api/v1/analysis/start`, it processes the image directly and returns the result. This is by design for single-machine deployments.

---

### Frontend Setup

```bash
cd cardioretina/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/cardioretina

# Redis (for Celery broker)
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Paths
MODEL_WEIGHTS_PATH=./ml/weights
UPLOAD_DIR=./uploads
REPORT_DIR=./reports

# Server
HOST=0.0.0.0
PORT=8000
```

---

## 🧠 Model Weights

The four pre-trained PyTorch model files are **not included** in this repository due to file size (~117 MB total).

| File | Size | Architecture |
|---|---|---|
| `quality_net.pth` | ~4 MB | MobileNetV3-Small (2-class) |
| `vessel_seg.pth` | ~35 MB | U-Net++ (filters: 32→64→128→256→512) |
| `av_classify.pth` | ~35 MB | U-Net++ 3-class (same arch, 3 output channels) |
| `disease_screen.pth` | ~43 MB | EfficientNet-B3 (5-class) |

Place all files in `backend/ml/weights/`.

---

## 🖼 Screenshots

<table align="center">
  <tr>
    <td align="center">
      <img src="images/dashboard.png" alt="Dashboard" width="400"/>
      <br />
      <b>Dashboard / Overview</b>
    </td>
    <td align="center">
      <img src="images/analysis.png" alt="Analysis" width="400"/>
      <br />
      <b>New Analysis / Scanning</b>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="images/output.png" alt="Output Results" width="400"/>
      <br />
      <b>Analysis Output Results</b>
    </td>
    <td align="center">
      <img src="images/reports.png" alt="Reports" width="400"/>
      <br />
      <b>Generated PDF Reports List</b>
    </td>
  </tr>
</table>

---

## 🔬 Clinical Workflow

```
1. Register Patient       → POST /api/v1/patients/
2. Record Visit           → POST /api/v1/visits/  (enter BP, sugar, cholesterol)
3. Upload Retinal Image   → POST /api/v1/analysis/start
4. Poll for Results       → GET  /api/v1/analysis/{job_id}
5. Download PDF Report    → GET  /reports/{report_filename}
```

---

## 📌 Known Limitations & Notes

- **Local ML Only**: The 4 AI models require ~600–800 MB RAM at peak inference. This exceeds the free tier of most cloud platforms. Run the backend locally on your own machine for full functionality. Cloud deployment requires a plan with ≥2 GB RAM (e.g., Railway Pro at $5/month).
- **Synchronous Pipeline**: With `task_always_eager=True`, analysis requests block until the full pipeline (~5–30s on CPU) completes. On a dedicated GPU machine this drops to ~2s per scan.
- **GPU Recommended**: All models auto-detect CUDA. On CPU, inference is significantly slower (~30s total vs ~2s on GPU).
- **Hypertension flag**: The `hypertension` boolean on the Patient model is stored but not yet consumed by the risk engine (planned for v1.1).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

**Proprietary and Confidential**

This project and its contents are the intellectual property of Sahil Powar. No part of this software may be duplicated, modified, or distributed without express written permission. See the `LICENSE` file for full details.

This project is for research and educational purposes. For clinical deployment, ensure compliance with applicable medical device regulations (FDA, CE marking, etc.).

---

<div align="center">

**Developed by Sahil Powar**<br/>
Built with ❤️ using FastAPI · PyTorch · React

</div>
