# Master AI Execution Prompt (`prompt.md`) — Revision 4

> **Instructions for AI Agent**: You are executing the industry-standard modernization of CardioRetina AI as specified in [`build.md`](file:///e:/Projects/others/medical/cardioretina-main/documents/build.md) (Revision 4). Revision 4 adds three things an Aug 2026 implementation audit found missing from Revision 3's execution plan: config externalization for pipeline thresholds (Task 0.3, build.md §5.10), a distinct risk-engine ML overhaul track (new Phase 6.5, build.md §7.3), and per-model held-out validation requirements inside Phase 6 (build.md §11.3). Everything else from Revision 3 below is unchanged.
> Follow these phase-by-phase execution instructions strictly. Files inside `backend/ml/` (v1) **may be edited directly** — including formulas, weights loading, model definitions, threshold logic, and inference math — when there's a documented case for improving the project. Every such edit MUST go through the change-control gate in `build.md` §7.1 (candidate branch, benchmark against the current baseline on the fixed golden set, documented rationale, recorded sign-off, changelog entry, version bump surfaced through `pipeline_gateway.py`) before it reaches production. No edit to `backend/ml/` is ever silent or undocumented. The v2 foundation-model track described in `build.md` §7.2 remains for larger architectural changes and still requires a shadow-mode evaluation window before promotion.

---

## 🔒 Mandatory Core Directives

1. **AI Pipeline Change Control (v1):**
   - `backend/ml/pipeline/main_pipeline.py`
   - `backend/ml/models/*`
   - `backend/ml/features/biomarkers.py`
   - `backend/ml/risk/risk_engine.py`
   - Edits to formulas, weights loading, model definitions, threshold logic, or inference math in these files **are permitted** when there's a documented improvement case (accuracy, calibration, or clinical safety). Every edit follows the change-control gate in `build.md` §7.1: work happens on a candidate branch, is benchmarked against the current production baseline on the fixed golden test set, is logged with a documented rationale and sign-off in `compliance/pccp/model_changelog.md`, and only then is promoted — with the version bump surfacing through `app/ml_interface/pipeline_gateway.py` so downstream monitoring and audit trails see it immediately. What's forbidden is not the edit — it's an edit that skips this gate.
2. **Backward Compatibility:**
   - Existing REST endpoints (`/api/v1/patients`, `/api/v1/visits`, `/api/v1/analysis`) MUST remain fully operational.
3. **Positioning Discipline:**
   - All UI copy, report text, and API response fields must reflect **clinician-facing decision support**, never autonomous diagnosis language, unless a future phase explicitly authorizes a change in positioning. No "diagnosed," "confirmed," or "detected disease" phrasing — use "risk flag," "screening result requiring clinician review," etc.
4. **v2 Foundation-Model Track Isolation:**
   - Anything under `backend/ml/v2_foundation/` runs in shadow mode only. Its output must never be written to a field a clinician-facing view reads, and must never influence `risk_engine.py` or `main_pipeline.py`, unless a promotion sign-off document exists in `compliance/pccp/`.
4a. **Risk-Engine ML Track Isolation (New, build.md §7.3):**
   - Anything under `backend/ml/risk/risk_engine_ml/` runs in shadow mode only, same isolation guarantee as directive 4. It must never influence a clinician-facing risk score unless promoted with a documented calibration plot, Brier score, and NRI/IDI comparison against a named standard risk score (PCE/Framingham/QRISK3), in addition to the standard §7.1 sign-off.
4b. **Config Is Not a Loophole (New, build.md §5.10):**
   - Values in `backend/ml/config/` are clinical-behavior parameters, not deployment settings. Any edit to a value that isn't the documented `v1-baseline` default (i.e., any edit made after Task 0.3's initial externalization) must go through the same §7.1 change-control gate as a code or weights edit.
5. **Design Aesthetic Requirement:**
   - The frontend MUST use **Shadcn UI**, **Tailwind CSS**, glassmorphism cards, dark mode slate palette (`#090d16`), and WebGL/Canvas shaders for fundus visualizers and risk gauges — and these visuals must render **real model attribution data**, not placeholder/decorative-only animation.
6. **Accessibility & Alert Design:**
   - Frontend must meet WCAG 2.1 AA. `critical_alert` WebSocket events must be rate-limited and dismissible-with-reason in the UI, not fired as unconditional modal pop-ups.

7. **Research Integrity & Claims Discipline:**
   - Any code, documentation, or report copy that states or implies a performance comparison (e.g., "beats," "replaces," "outperforms" a standard risk score) must be backed by the statistical tests specified in `build.md` §13.3 (NRI/IDI vs. a named baseline, calibration, external validation) — never by AUC alone. Do not write comparative claims the evaluation pipeline cannot support.
   - Every held-out evaluation split must be logged with patient-level provenance (no image-level leakage across train/val/test splits from the same patient).

---

## 🚀 Execution Phases

### Phase 0: Compliance & Quality Scaffolding
- **Task 0.1**: Create `compliance/qms/`, `compliance/risk_management/`, `compliance/software_lifecycle/`, `compliance/pccp/` directory scaffolding with README stubs describing their purpose (ISO 13485 design history file, ISO 14971 hazard analyses, IEC 62304 lifecycle artifacts, and a living PCCP draft/model changelog, respectively).
- **Task 0.2**: Create `compliance/pccp/model_changelog.md` seeded with an entry for the current v1 pipeline as the baseline version (version tag, validation dataset reference, date established) — this is the reference point every future change-controlled edit gets benchmarked against.
- **Task 0.3** *(New)*: Create `backend/ml/config/` per `build.md` §5.10 and externalize the currently hard-coded quality threshold, vessel post-processing parameters, A/V fusion weights, biomarker zone/caliper/tortuosity parameters, risk classification bands, and DR referral threshold into versioned YAML. The `v1-baseline` config values must exactly match the current hard-coded behavior — this is a refactor, not a threshold change, and does not itself require a §7.1 benchmark run. Any *future* edit to a value in this config does require the §7.1 gate, same as editing the code directly.

### Phase 1: Database & Multi-Tenancy Expansion
- **Task 1.1**: Create `backend/app/models/organization.py` (`id`, `name`, `code`, `license_key`, `created_at`).
- **Task 1.2**: Create `backend/app/models/user.py` (`id`, `org_id` FK, `email`, `hashed_password`, `full_name`, `role` [`ADMIN`, `DOCTOR`, `TECHNICIAN`], `is_active`, `mfa_enabled`).
- **Task 1.3**: Update `backend/app/models/patient.py` and `visit.py` to include `org_id` (FK to `organizations.id`).
- **Task 1.4**: Create `backend/app/models/audit_log.py` with hash-chained, append-only semantics (`id`, `user_id`, `action`, `resource`, `ip_address`, `timestamp`, `prev_hash`, `row_hash`). Writes go through `backend/app/core/audit_chain.py`, never direct inserts.
- **Task 1.5**: Update `backend/app/database.py` to use Async SQLAlchemy 2.0 (`create_async_engine` + `asyncpg`).
- **Task 1.6**: Write and apply PostgreSQL Row-Level Security (RLS) policies on `patients`, `visits`, `analyses`, and `audit_log`, scoped by `org_id`, as a defense-in-depth layer independent of application-level filtering. Include an Alembic migration.

### Phase 2: Auth, JWT & Dual-Protocol Zero-Touch Ingestion
- **Task 2.1**: Implement `backend/app/core/security.py` (`passlib[bcrypt]`, `python-jose`) for password hashing and JWT creation/verification. Add MFA (TOTP) support.
- **Task 2.2**: Implement `backend/app/core/rbac.py` with role-checking dependencies (`require_role(["ADMIN", "DOCTOR"])`).
- **Task 2.3**: Create `backend/app/api/v1/auth.py` with `/login`, `/me`, `/refresh`, `/mfa/verify`.
- **Task 2.4**: Create `backend/app/core/dicom_parser.py` (`pydicom`) to extract metadata (Patient ID, Name, Age) and convert pixel data to 8-bit RGB.
- **Task 2.5**: Create `backend/app/api/v1/dicom.py` — `POST /api/v1/dicom/upload` for legacy `.dcm` uploads.
- **Task 2.6**: Create `backend/app/api/v1/dicomweb.py` implementing STOW-RS (store), WADO-RS (retrieve), and QIDO-RS (query) as the primary cloud-native ingestion path.
- **Task 2.7**: Implement `backend/app/services/ingestion_watcher.py` (Watchdog hot-folder listener) as the legacy on-prem compatibility path.
- **Task 2.8**: Implement `backend/app/services/dicom_scp_server.py` (DICOM C-STORE network listener) as the legacy compatibility path for direct camera/PACS pushes.
- **Task 2.9**: Ensure Tasks 2.4–2.8 all normalize into a single internal ingestion contract regardless of which protocol delivered the image.

### Phase 3: Real-Time WebSockets, Async Task Queue & EHR Interoperability
- **Task 3.1**: Refactor `backend/app/tasks/celery_app.py` to support production async mode (Redis broker) and eager local testing mode, with priority queues (`stat_queue`, `routine_queue`).
- **Task 3.2**: Create `backend/app/api/v1/websockets.py` with a WebSocket manager broadcasting `analysis_queued`, `step_progress`, `completed`, `critical_alert` (rate-limited).
- **Task 3.3**: Connect `backend/app/tasks/analysis_task.py` to broadcast progress via the WebSocket manager.
- **Task 3.4**: Build `backend/app/ml_interface/pipeline_gateway.py` — the single stable, versioned entry point into `backend/ml/`. Every call returns a result object carrying model version, per-risk-module version, and confidence/uncertainty.
- **Task 3.5**: Implement `backend/app/services/fhir_service.py` as a SMART-on-FHIR-capable module: OAuth2/OIDC client registration, launch-context handling, scoped resource access, and generation of `DiagnosticReport` + LOINC-coded `Observation` + `Provenance` FHIR R4 resources.
- **Task 3.6**: Create `backend/app/api/v1/smart_fhir.py` for the SMART launch sequence.
- **Task 3.7**: Create `backend/app/api/v1/cds_hooks.py` implementing a CDS Hooks service so hospital EHRs can trigger CardioRetina AI at the point of care.
- **Task 3.8**: Create `backend/app/services/model_monitoring.py` — logs pipeline-gateway inputs/outputs, computes data-drift, output-drift, calibration, and fairness metrics per risk module, and writes changelog entries to `compliance/pccp/model_changelog.md`.

### Phase 4: Frontend Redesign (Shadcn UI + Shader Inspiration + Explainability)
- **Task 4.1**: Upgrade `frontend/src/index.css` with dark mode tokens (`#090d16`), glassmorphic panel utilities, custom scrollbars, and WCAG 2.1 AA-compliant contrast ratios.
- **Task 4.2**: Install/build Shadcn UI base primitives (`Card`, `Button`, `Dialog`, `Tabs`, `Badge`, `Slider`, `Tooltip`, `Select`, `Table`).
- **Task 4.3**: Implement WebGL/Canvas Shader Components, driven by real pipeline-gateway attribution data:
  - `src/components/shaders/RetinalGridShader.tsx`: animated background grid.
  - `src/components/shaders/VesselGlowOverlay.tsx`: overlay glow keyed to actual vessel/region attribution, not decorative-only pulse.
  - `src/components/shaders/RiskRadarShader.tsx`: risk gauge that renders confidence/uncertainty bands from the model result object.
- **Task 4.4**: Build `src/components/FundusViewer/MaskSplitSlider.tsx` (Raw Fundus vs Vessel Mask vs A/V Mask split slider).
- **Task 4.5**: Redesign Pages:
  - `Dashboard.tsx`: clinical telemetry dashboard (live scan counter, high-risk alerts ticker rate-limited per Task 4.6, disease-distribution graphs, model-version indicator).
  - `Ingestion/QueueMonitor.tsx`: real-time feed covering both DICOMweb and legacy DICOM ingestion activity.
  - `NewAnalysisWizard.tsx`: multi-modal upload (DICOMweb + legacy DICOM drag-and-drop + manual intake + fundus preview).
  - `AnalysisStatus.tsx`: live step-by-step pipeline animation with WebGL attribution visualizer.
- **Task 4.6**: Implement alert-fatigue-aware handling of `critical_alert` events: severity tiering, rate limiting, and a dismiss-with-reason flow logged to the audit chain.

### Phase 5: A/V Visualization Output (Pipeline Contract Addition)
- **Task 5.1**: Modify the A/V fusion stage's output contract (via `pipeline_gateway.py`) so every analysis emits a color-coded artery/vein overlay image at original resolution, alongside the existing raw fundus image and vessel-only mask. If improving the underlying A/V model itself is warranted to make the overlay more accurate, that follows the §7.1 change-control gate like any other model edit.
- **Task 5.2**: Store all three images (raw fundus, vessel mask, A/V overlay) per-analysis in the object storage layer, referenced from the `analyses` record, served via signed URLs scoped by existing RLS/`org_id` boundaries.
- **Task 5.3**: Wire `MaskSplitSlider.tsx` and `VesselGlowOverlay.tsx` to the new A/V overlay artifact so a doctor can view Raw Fundus / Vessel Mask / A/V Overlay for the image they just uploaded, with hover-to-see-confidence on `VesselGlowOverlay`.

### Phase 6: ML Training & Dataset Pipeline (Feeds Change-Controlled Edits to v1)
- **Task 6.1**: Stand up a training workspace isolated from `backend/ml/pipeline/`, `backend/ml/models/`, `backend/ml/features/biomarkers.py`, and `backend/ml/risk/risk_engine.py`. Nothing in this phase edits those files directly.
- **Task 6.2**: Build ingestion/preprocessing for the datasets listed in `build.md` §11.2 (EyePACS, APTOS 2019, DDR, IDRiD, Messidor-2 for DR grading; DRIVE/STARE/CHASE_DB1/HRF for vessel segmentation; RITE, HRF-AV, LES-AV, Fundus-AVSeg for A/V classification). Respect each dataset's license/access terms — UK Biobank requires a separate formal application and is gated, not bundled.
- **Task 6.3**: Implement the training pipeline per `build.md` §11.3 — pretrain on the large pool, fine-tune DR grading on the combined dataset, fine-tune A/V classification on the combined dataset (with an auxiliary vessel-segmentation loss term), and retrain the quality-check and vessel-segmentation stages.
- **Task 6.3a** *(New)*: Benchmark each retrained model against its own fixed held-out set, not a shared one: quality against a DDR/EyePACS split, vessel segmentation against DRIVE/STARE/CHASE_DB1/HRF held-out, A/V classification against the Fundus-AVSeg 20-image test split, and DR grading against the APTOS + DDR + Messidor-2 test splits. Record each result in `compliance/pccp/model_changelog.md`.
- **Task 6.4**: Every training run produces a versioned, benchmarked candidate model, logged to `compliance/pccp/model_changelog.md` with its evaluation results against the currently-promoted production baseline on a fixed held-out set.
- **Task 6.5**: Any candidate promotion to production follows the `build.md` §7.1 change-control gate (or the longer §7.2 gate for a foundation-model architectural change) — documented rationale and benchmark comparison, sign-off recorded in `compliance/pccp/`, version bump surfaced through `pipeline_gateway.py`. No candidate replaces what's in production without going through this gate.

### Phase 6.5: Risk Engine ML Overhaul (New — Gated on UK Biobank Access, build.md §7.3)
- **Task 6.5.1**: Stand up `backend/ml/risk/risk_engine_ml/` as a shadow-only candidate track, isolated from the production `risk_engine.py` per core directive 4a. Do not wire its output into any clinician-facing field.
- **Task 6.5.2**: Train a calibrated gradient-boosted model (XGBoost/LightGBM) or shallow neural net using the 4 vessel biomarkers + DR grade + available clinical data (age, blood pressure, blood glucose, cholesterol, diabetes history) as inputs, targeting 5-year MACE incidence from UK Biobank outcome-linked data (or a surrogate outcome — CAC score, carotid IMT — if MACE follow-up is unavailable for the accessible subset).
- **Task 6.5.3**: Evaluate the candidate's calibration plot, Brier score, and NRI/IDI versus a named standard risk score (PCE, Framingham, or QRISK3, matched to the target population per `build.md` §13.3) — AUC alone does not satisfy this task.
- **Task 6.5.4**: Log the full evaluation to `compliance/pccp/model_changelog.md`. Promotion to production follows the `build.md` §7.3 gate: everything in §7.1 (candidate branch, benchmark, changelog, sign-off, version bump through `pipeline_gateway.py`) plus the documented equivalence-or-better evidence from Task 6.5.3.
- **Task 6.5.5**: Do not begin Task 6.5.2 until UK Biobank access is confirmed — file the access application in Phase 0/Week 1 per `build.md` §14.4 so this phase is not blocking the critical path later.

### Phase 7: Verification & Safety Audit
- **Task 7.1**: Run full backend test suite / health checks to confirm API routes resolve correctly.
- **Task 7.2**: Golden-output regression test — for backend refactors that are *not* intended to change model behavior (API/infra changes only), verify the v1 ML pipeline produces byte/metric-identical biomarker outputs and risk calculations on a fixed reference image set. For changes made intentionally through the §7.1 change-control gate, verify instead that the required benchmark-against-baseline comparison was run and logged, per the gate's documentation requirement — the expectation is a *recorded, reviewed* difference, not an identical one.
- **Task 7.3**: Verify frontend build (`npm run build`) compiles cleanly without TypeScript or CSS errors, and passes automated WCAG 2.1 AA checks.
- **Task 7.4**: Verify RLS policies block cross-tenant access even when application-layer `org_id` filtering is deliberately bypassed in a test.
- **Task 7.5**: Verify the audit-log hash chain detects tampering (modify one historical row in a test DB and confirm chain verification fails).
- **Task 7.6**: Exercise the SMART-on-FHIR launch flow and at least one CDS Hooks card against a reference/sandbox EHR.
- **Task 7.7**: Confirm `model_monitoring.py` produces a baseline drift/fairness report and writes a changelog entry.
- **Task 7.8**: Confirm the v2 foundation-model track (if present in the branch) is unreachable from any clinician-facing code path without a promotion record in `compliance/pccp/`.
- **Task 7.9** *(New)*: Confirm `backend/ml/config/` `v1-baseline` values byte-match the previously hard-coded thresholds (Task 0.3), and that the active config version is visible in the versioned result object from `pipeline_gateway.py`.
- **Task 7.10** *(New)*: Confirm `backend/ml/risk/risk_engine_ml/` (if present in the branch) is unreachable from any clinician-facing risk score without a promotion record — including the calibration/Brier/NRI/IDI evidence — in `compliance/pccp/`.

---

### Phase 8: Research Validation & Publication Readiness
- **Task 8.1**: Create the `research/` workspace per `build.md` §13.7 (`protocol/`, `reporting_checklists/`, `fairness_audit/`, `explainability_study/`, `model_card.md`, `data_availability.md`).
- **Task 8.2**: Draft the preregistered validation study protocol and statistical analysis plan in `research/protocol/` — specify the target baseline (PCE, Framingham, or QRISK) the CVD module will be compared against via NRI/IDI, and the external validation population, before any evaluation results are unblinded.
- **Task 8.3**: Complete TRIPOD+AI and STARD-AI checklists in `research/reporting_checklists/` alongside the currently-promoted v1 model and any candidate from the Phase 6 training track.
- **Task 8.4**: Implement the prespecified fairness audit (`research/fairness_audit/`) using the `model_monitoring.py` fairness-drift infrastructure from Phase 3 — subgroup-stratified sensitivity/specificity/calibration, registered before analysis.
- **Task 8.5**: Design and run the clinician-agreement study for the A/V attribution overlay (`research/explainability_study/`) per `build.md` §13.5 — blinded clinician review of attribution plausibility, reported as its own metric.
- **Task 8.6**: Populate `research/model_card.md` and `research/data_availability.md` per `build.md` §13.6.

---

## 🏁 Verification Checklist

- [ ] All PyTorch `.pth` weight loading remains completely intact in `backend/ml/weights/`.
- [ ] v1 ML pipeline outputs identical risk score and biomarkers for the reference test image set.
- [ ] DICOMweb (STOW-RS/WADO-RS/QIDO-RS) and legacy DICOM C-STORE/hot-folder ingestion both work and normalize to the same internal contract.
- [ ] WebSockets broadcast live status updates during analysis execution, with `critical_alert` rate-limited.
- [ ] Row-Level Security is enforced independently of application-layer tenant scoping.
- [ ] Audit log is append-only and hash-chain-verifiable.
- [ ] SMART-on-FHIR launch and CDS Hooks integration tested against a reference EHR sandbox.
- [ ] Shadcn UI components render with WebGL shaders driven by real attribution/confidence data.
- [ ] Frontend passes WCAG 2.1 AA automated checks.
- [ ] Multi-tenant organization scoping enforced across patient and visit APIs at both app and DB layers.
- [ ] Drift/fairness monitoring produces a baseline report and changelog entry.
- [ ] No clinician-facing surface can display v2 foundation-model output without a recorded promotion sign-off.
- [ ] All UI/report copy uses decision-support language, never autonomous-diagnosis language.
- [ ] Every analysis produces and stores a color-coded A/V overlay image, viewable via `MaskSplitSlider` and `VesselGlowOverlay` alongside the raw fundus image and vessel mask.
- [ ] Any change to `backend/ml/` — whether a direct edit or a candidate from the Phase 6 training pipeline — is benchmarked against the previously-promoted baseline and logged to `compliance/pccp/model_changelog.md`, with a recorded sign-off, before promotion.
- [ ] `research/` workspace exists with a preregistered protocol, completed TRIPOD+AI/STARD-AI checklists, and a fairness audit report.
- [ ] No comparative performance claim ("beats," "replaces," "outperforms") appears anywhere without NRI/IDI evidence against a named baseline risk score.
- [ ] `backend/ml/config/` externalizes quality/vessel/A-V-fusion/biomarker/risk/DR-threshold parameters with a `v1-baseline` matching prior hard-coded behavior; any later edit went through the §7.1 gate.
- [ ] Each retrained imaging model (quality, vessel, A/V, disease) is benchmarked against its own named held-out set (not a shared one), per `build.md` §11.3.
- [ ] No clinician-facing risk score reflects `risk_engine_ml/` output without a recorded promotion including calibration, Brier score, and NRI/IDI evidence per `build.md` §7.3.
