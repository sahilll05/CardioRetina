# CardioRetina AI Backend Pipeline

This documented provides a detailed technical overview of the backend pipeline for the **CardioRetina AI** project. The backend is built using **FastAPI** to serve the ML pipelines that process retinal images to estimate cardiovascular disease risks.

---

## 🏗️ Architecture Overview

The backend acts as an orchestrator tying together:
- **FastAPI**: The main web framework handling routing and requests.
- **SQLAlchemy (SQLite/PostgreSQL)**: Handles relational database management (patients, visits, analysis states).
- **Celery**: Task queue for asynchronous execution of the machine learning pipeline (though configured to be eager via `task_always_eager` in development).
- **Machine Learning Pipeline**: A monolithic pipeline separated into sub-modules (Quality, Vessel, A/V, Disease, Biomarkers, Risk Engine).

## 📊 The 7-Step AI Pipeline

The core ML inference takes place in the `ml/pipeline/main_pipeline.py`. When an image and clinical data are submitted for analysis, they go through the following steps sequentially:

### 1. 🔍 Quality Check
**Component**: `QualityInference`
- **Purpose**: Evaluates whether the uploaded retinal image is of sufficient quality for medical analysis.
- **Output**: A `quality_score` and a boolean `is_gradable`.
- **Action**: If the image is **not gradable**, the pipeline halts immediately, changes the job status to `failed`, and notifies the frontend to prompt a retake.

### 2. 🩸 Vessel Segmentation
**Component**: `VesselInference`
- **Purpose**: Detects and segments blood vessels from the retinal background.
- **Output**: A binary mask (`vessel_mask`) mapping out the network of blood vessels. It calculates total network pixels (e.g., vessel density approximation).

### 3. 🔴🔵 A/V (Artery/Vein) Classification
**Component**: `AVInference`
- **Purpose**: Takes the output of the Vessel Segmentation mask and separates vessels into distinct Arteries and Veins parameters.
- **Output**: Separate masks for arteries (`artery_mask`) and veins (`vein_mask`).

### 4. 📊 Biomarker Extraction
**Component**: `BiomarkerExtractor`
- **Purpose**: Processes the segmented generic, arterial, and venous structures to extract quantitative clinical features.
- **Outputs**:
  - `av_ratio`: Artery-to-Vein ratio (a core cardiovascular predictor).
  - `vessel_density`: Percentage of the retina covered by vessels.
  - `tortuosity`: How "twisted" the blood vessels are.
  - `branching_angle`: Patterns of how the blood vessels split.

### 5. 🏥 Disease Screening
**Component**: `DiseaseInference`
- **Purpose**: Screens for indicators of specific retinal or systemic diseases from the image itself (such as Diabetic Retinopathy).
- **Outputs**: Features like `dr_grade` (Severity), `dr_probability`, and overall class probabilities.

### 6. ⚠️ Risk Assessment
**Component**: `RiskEngine`
- **Purpose**: Integrates the imaging biomarkers, disease screening outputs, and **user-supplied clinical data** (Age, Blood Pressure, Cholesterol, Blood Sugar, Diabetes history).
- **Outputs**: Calculates an overall cardiovascular `risk_level`, `confidence` score, and detailed `reasons` explaining the computed risk level.

### 7. 💾 Saving Masks & Reporting
**Component**: `ReportService` & Database Updates
- **Purpose**: Saves all intermediate generated masks locally so they can be viewed via the API.
- **Outputs**: Paths to `vessel_mask`, `artery_mask`, `vein_mask`, generation of a final clinical `report_path`, and updates the database entry for the analysis job with `status = "completed"`.

---

## ⚙️ Core Request Flow

1. **Client Submission (`POST /api/v1/analysis/start`)**:
   - The frontend submits an image, clinical details, and visit IDs.
   - The API uploads the image locally, creates a database entry for the `Analysis` in the `pending` state, assigns a unique `job_id`, and fires off the async Celery task (`run_analysis_pipeline`).

2. **Background Processing (`app/tasks/analysis_task.py`)**:
   - Retrieves the analysis object. Marks it as `processing`.
   - Initializes the 4 heavy deep-learning models (cached via `get_models()`).
   - Executes the **MainPipeline**.
   - If an exception occurs or step 1 (Quality Check) fails, the DB object updates to `failed`.
   - If successful, it invokes `ReportService` to build a final clinical report and updates the database item to `completed` populating all results.

3. **Status Polling (`GET /api/v1/analysis/{job_id}`)**:
   - The frontend constantly polls this endpoint while processing is underway. 
   - Once completed, it returns the structured `AnalysisResult` mapping strictly to the patient's record, complete with AI models' assessments and mask overlays.

---

## 🚀 Running The Server

1. **Activate the Virtual Environment**:
   ```bash
   .\venv\Scripts\activate
   ```
2. **Start FastAPI Application**:
   ```bash
   uvicorn app.main:app --port 8000 --reload
   ```

*During initialization (`startup_event`), the models are preloaded into memory (CPU standard) to reduce latency on first request.*

## 🗂️ Project Directory Breakdown

- `app/api/v1`: Contains the router endpoints handling Patients, Visits, and the crucial Analysis.
- `app/models`: SQLAlchemy database schemas defining metadata mapping.
- `app/tasks`: Contains the Celery background worker implementations.
- `ml/`: Subdirectory for all Machine Learning aspects.
  - `models/`: Heavy inference classes (Quality, Vessel, AV, Disease).
  - `features/`: Heuristic operations (Biomarkers calculation).
  - `risk/`: Hybrid logic integrating AI output with clinical rules.
  - `pipeline/`: Combines models into a single sequential operation.
