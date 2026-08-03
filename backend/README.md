# CardioRetina AI - Backend System Architecture

Welcome to the backend repository of **CardioRetina AI**. This document provides an exhaustive, minute-by-minute technical breakdown of the backend architecture, machine learning pipeline, API endpoints, database schema, and configuration.

## 1. System Overview & Tech Stack

This backend is a robust RESTful API built to process retinal images, extract cardiovascular biomarkers, and calculate disease risk. It relies on a blend of asynchronous web processing and heavy deep-learning inference.

### Core Technologies:
- **Web Framework**: FastAPI (astapi>=0.104.1) paired with Uvicorn for ASGI server deployment.
- **Machine Learning**: PyTorch (	orch>=2.6.0, 	orchvision>=0.21.0) for model inference, OpenCV (opencv-python), and scikit-image for preprocessing and mask generation.
- **Database ORM**: SQLAlchemy (>=2.0.23) with Alembic for migration management (PostgreSQL via psycopg2-binary or SQLite).
- **Asynchronous Tasks**: Celery with Redis as the message broker (celery>=5.3.4, edis>=5.0.1).
- **Data Validation**: Pydantic v2.

---

## 2. Directory Structure Deep Dive

- lembic/ & lembic.ini: Contains Alembic database migration scripts for schema evolution.
- pp/: FastAPI application core.
  - pi/v1/: Includes modular API routings (nalysis.py, patients.py, isits.py).
  - models/: SQLAlchemy database models representing tables (patient.py, isit.py, nalysis.py).
  - schemas/: Pydantic models for strict request/response validation.
  - services/: Business logic like eport_service.py (PDF generation) and storage_service.py (File I/O).
  - 	asks/: Celery asynchronous background jobs (nalysis_task.py).
  - config.py: Environment variable mapping via pydantic-settings.
  - database.py: SQLAlchemy engine setup and session creation.
- ml/: The core Machine Learning intelligence layer.
  - models/: Pre-trained PyTorch inference classes mapped to models (A/V, Disease, Quality, Vessel).
  - eatures/: Heuristic computation like iomarkers.py combining mask data.
  - isk/: isk_engine.py for algorithmic probability evaluation using ML + clinical data.
  - weights/: Model binaries (v_classify.pth, disease_screen.pth, quality_net.pth, essel_seg.pth).
  - pipeline/: Orchestrates the ML inferences sequentially.

---

## 3. The 7-Step ML Pipeline Workflow

The heart of the application is the MainPipeline (ml/pipeline/main_pipeline.py). Upon execution, it performs:

### Step 1: Quality Check (QualityInference)
- **Input**: Raw retinal image.
- **Process**: Runs a lightweight PyTorch CNN to determine artifacts, blur, and lighting conditions.
- **Output**: Returns is_gradable (bool) and a quality score. Rejects non-gradable images immediately.

### Step 2: Vessel Segmentation (VesselInference)
- **Input**: Raw retinal image.
- **Process**: Puts the image through a U-Net style architecture to extract a vascular outline.
- **Output**: Calculates essel_pixels thresholding and a inary_mask output mapping.

### Step 3: Arteriovenous (A/V) Classification (AVInference)
- **Input**: Raw retinal image & mapped essel_mask.
- **Process**: Differentiates arteries (oxygenated) from veins (deoxygenated) along the segmented vasculature.
- **Output**: Individual rtery_mask and ein_mask binary segmentations.

### Step 4: Biomarker Extraction (BiomarkerExtractor)
- **Input**: Computed essel_mask, rtery_mask, ein_mask.
- **Process**: Utilizes mathematical morphology and contour detection to evaluate pixel density, branching angles (bifurcation), tortuosity (vessel twisting), and the cardiovascular critical Arteriovenous Ratio (AVR).
- **Output**: Dictionary of floating-point physiological markers.

### Step 5: Disease Screening (DiseaseInference)
- **Input**: Raw retinal image.
- **Process**: Identifies pathologies like Diabetic Retinopathy (DR) using multi-class classification.
- **Output**: Pathological diagnosis and probability metrics.

### Step 6: Cardiovascular Risk Assessment (RiskEngine)
- **Input**: Computed biomarkers, disease detection, and clinical metadata (Age, gender, blood pressure, BMI, etc.).
- **Process**: Fuses heuristic thresholds and medical logical decision trees to establish a cardiovascular event risk level.
- **Output**: Risk classification (e.g., Low, Medium, High) with confidence scoring and clinically-worded justifications.

### Step 7: Saving & Reporting
- **Process**: Saves generated rtery_mask, ein_mask, and essel_mask back to disc in the /reports or /uploads directory. Updates database analysis status to completed.

---

## 4. API Endpoints Breakdown (v1)

### patients.py
Endpoints dedicated to patient record management. Includes patient creation, retrieval, listing, and updates, feeding into the Patient SQLAlchemy model.

### isits.py
Groups retinal images by clinical episode. Allows attaching new image visits to existing patients, encapsulating the clinical metadata that feeds the risk engine.

### nalysis.py
The execution layer for the AI. 
- POST /start: Initializes an analysis task. Saves uploaded media to UPLOAD_DIR, queues a Celery background job (	asks/analysis_task.py), and returns a tracked job_id.
- GET /{job_id}: Checks the processing status (pending, processing, completed, failed) and eventually serves the complex JSON tree of the pipeline response.

---

## 5. Configuration & Environment Variables

Controlled primarily by pp/config.py. Key .env parameters required for successful execution:
- DATABASE_URL: Connection string for SQLAlchemy (e.g., postgresql://user:pass@localhost/db or sqlite:///./app.db).
- REDIS_URL: Celery broker connection string.
- SECRET_KEY & ALGORITHM: Used for JWT authentication (if active) and cryptographic signing.
- MODEL_WEIGHTS_PATH: Relative path pointing to the ./ml/weights folder.
- UPLOAD_DIR & REPORT_DIR: Temporary disc buffers for file management.

---

## 6. How to Run Locally

1. **Setup the Virtual Environment**:
   `ash
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   source venv/bin/activate  # Linux/Mac
   `
2. **Install Dependencies**:
   `ash
   pip install -r requirements.txt
   `
3. **Run Database Migrations**:
   *(Assumes you have set a valid DATABASE_URL in the .env file)*
   `ash
   alembic upgrade head
   `
4. **Boot the FastAPI Server**:
   `ash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   `
5. **Start the Celery worker (If bypassing eager execution)**:
   `ash
   celery -A app.tasks worker --loglevel=info
   `

## 7. Performance & Memory Considerations

- **Initialization Load**: The ML models (QualityInference, VesselInference, AVInference, DiseaseInference) are eagerly loaded onto system RAM/VRAM during the FastAPI @app.on_event("startup") block. This demands substantial initial memory overhead but ensures zero-latency model spinning per API request.
- **Thread Blocking**: Inference occurs entirely outside the standard async web loop using Celery. If bypassing Celery (using synchronous endpoints), MainPipeline.run() operations are CPU intensive and will halt simultaneous incoming requests if not parallelized.
