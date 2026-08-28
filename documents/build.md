# CardioRetina AI — Enterprise Modernization, Industry Research & Architecture Blueprint (`build.md`)

> **Revision 4** — This revision incorporates findings from an implementation-status audit (Aug 2026) that assessed the actual codebase against Revision 3 of this blueprint. The audit found the architecture and research direction sound (~30% implemented: backend ML pipeline + basic frontend), but identified three concrete gaps this revision closes: (1) pipeline parameters/thresholds were hard-coded rather than exposed as versioned config (§5.10), (2) the risk engine's evolution from rule-based scoring to a calibrated, outcome-trained model was implied but not specified as its own gated workstream (§7.3), and (3) per-model validation requirements for change-controlled edits (§7.1) were not tied to specific held-out test splits (§11.3). A new §14 tracks implementation status and effort against the phase plan. Revision 3's repositioning (oculomics over single-disease DR+CVD, CDS posture, governed change control replacing "never touch," SMART on FHIR/CDS Hooks, dual-protocol ingestion, real compliance scaffolding) remains unchanged and is carried forward below.

---

## 1. Executive Summary & Positioning

**CardioRetina AI** is a clinical decision-support (CDS) platform that performs multi-disease **oculomics triage** from a single retinal fundus photograph: diabetic retinopathy (DR) grading, non-invasive cardiovascular (CVD) risk stratification, and an extensible slot for additional systemic-risk flags (chronic kidney disease, stroke risk) as the research and validation program matures.

### What changed from v1 and why
- **Not "DR + CVD," but oculomics.** The published research trend is broader than a single CVD score — cardiovascular, renal, and neurodegenerative signal has all been demonstrated from fundus images. Building a single hard-coded CVD score is already behind where the field is. The architecture must treat "systemic risk domains" as a pluggable, versioned set, not a single fixed output.
- **CDS posture, not autonomous-diagnosis posture (by default).** The three FDA-cleared products in this space (LumineticsCore/IDx-DR, EyeArt, AEYE-DS) are all cleared as **autonomous diagnostic** devices for DR — a De Novo/510(k) pathway with a high evidentiary bar. CardioRetina AI's CVD/oculomics output is explicitly positioned as **clinician-facing decision support**, not an autonomous diagnosis, which is a materially lighter and faster regulatory lift and is also the honest framing given the current maturity of CVD-from-retina evidence. Autonomous-diagnosis clearance for the DR component remains a *future* option, not a v1 requirement.
- **The ML pipeline can be improved directly — through a governed change-control process, not a silent edit.** The original "never touch `backend/ml/`" rule is replaced (§7) with a change-control gate: any edit to formulas, weights, thresholds, or inference math is permitted when there's a documented improvement case, but must go through validation against the prior baseline, versioning, and sign-off before promotion. Alongside this, a formal **v2 foundation-model track** (§7.2) remains available for larger architectural changes that warrant a longer shadow-mode evaluation before promotion. Both paths funnel into the same PCCP-aligned changelog, so the product has one coherent, auditable model-improvement story instead of two.
- **Interoperability is upgraded from "generates FHIR JSON" to "is a FHIR/SMART app."** Static `DiagnosticReport` JSON generation is replaced with a SMART-on-FHIR-launchable app plus CDS Hooks integration, which is what actually lets the product sit inside Epic/Cerner workflows instead of next to them.
- **Ingestion is dual-protocol.** Legacy DICOM C-STORE / hot-folder ingestion is preserved for existing fundus cameras and PACS, but DICOMweb (STOW-RS/QIDO-RS/WADO-RS) is added as the primary, cloud-native ingestion path — this is where the industry has moved for anything SaaS-hosted.
- **A real security/compliance layer is added.** v1 had none. HITRUST-aligned controls, SOC 2 Type II readiness, Zero Trust network segmentation, envelope encryption via KMS, and tamper-evident (hash-chained, append-only) audit logging are now explicit requirements, not implied by "HIPAA audit log" table.
- **Quality system scaffolding is added.** ISO 13485 (QMS), ISO 14971 (risk management), and IEC 62304 (software lifecycle) artifacts are introduced as living documents alongside the code, because "industry standard" for a medical AI product means the *process*, not just the software, has to be auditable.

---

## 2. Research Basis (Summary of Findings, 2026)

This section exists so future contributors know *why* decisions were made, not just what they are.

### 2.1 Competitive & regulatory landscape
- **LumineticsCore (formerly IDx-DR), Digital Diagnostics** — first FDA De Novo autonomous AI diagnostic (2018), DR/DME only, requires a specific Topcon camera, ETDRS/DRCR-based grading.
- **EyeArt, Eyenuk** — 510(k) cleared on the LumineticsCore predicate (2020), DR only, validated with sensitivity ~95.5% / specificity ~86% for referable/vision-threatening DR in multicenter trials.
- **AEYE Diagnostic Screening (AEYE-DS)** — third FDA-cleared system (2022), portable/handheld-capable, DR only.
- **Google ARDA / academic oculomics work** — research-only; not a commercial product. This is the closest prior art to "CVD from retina," but it has not been productized or clinically deployed at scale, and post-2023 research (RETFound, UK Biobank oculomics work, Reti-CKD) has moved well past the original 2018 approach.
- **Conclusion:** No commercially cleared product currently combines DR grading with systemic-risk oculomics. That is the genuine white space — but it also means CardioRetina AI cannot borrow a regulatory or clinical-validation playbook from a competitor and must build its own evidence package.

### 2.2 Oculomics research direction
- Retinal vascular biomarkers (caliber, tortuosity, branching angle, arteriovenous ratio) are established correlates of cardiovascular, renal, and neurodegenerative status, not just diabetic eye disease.
- A CKD-specific score (Reti-CKD) already exists in the literature with demonstrated incremental predictive value over standard risk equations.
- 2026 multi-omic work links retinal imaging features to cardiovascular and neurological structure/function, lipid metabolism, and neurodegenerative-associated gene sets — i.e., the retina-as-systemic-biomarker thesis is actively expanding, not narrowing.
- **Implication:** design the risk-engine interface as a registry of independently-versioned "risk modules" (CVD module v1, CKD module optional, stroke-flag optional) rather than a single hardcoded score, so new validated modules can be added without refactoring the pipeline contract.

### 2.3 Model architecture direction
- RETFound (self-supervised Masked Autoencoder, 1.6M unlabelled retinal images) and related retinal foundation models (FLAIR, EyeFound, UrFound) outperform task-specific from-scratch CNNs on label-efficiency and cross-task generalization, including for incident prediction of systemic disease (heart failure, MI).
- **Implication:** the current v1 architecture (MobileNetV3 quality check, U-Net++ vessel/AV segmentation, EfficientNet-B3 DR grading) is a legitimate, defensible clinical baseline — but it is not where a from-scratch build would start today. Incremental retraining within the existing architecture (§7.1) can close some of this gap; the v2 track (§7.2) is for a genuine architectural move to foundation-model pretraining.

### 2.4 Regulatory tooling
- FDA's PCCP framework (finalized Dec 2024, expanded Aug 2025 jointly with Health Canada and UK MHRA) lets a manufacturer pre-specify future AI/ML modifications, their validation methodology, and impact assessment as part of the *initial* marketing submission — avoiding a new submission per update, provided changes stay within the pre-agreed scope.
- Guiding principles: PCCPs should be **focused** (clearly defined, verifiable modifications), **risk-based**, and **evidence-based**; labeling must disclose when a device operates under a PCCP and what changed.
- **Implication:** even before seeking any clearance, structure model versioning, validation datasets, and change logs *as if* a PCCP submission were coming. Retrofitting this later is much more expensive than building it in from day one.

### 2.5 Interoperability standards
- SMART on FHIR (OAuth2 + OpenID Connect on top of FHIR) is the standard mechanism for launching a third-party app from, and exchanging data with, an EHR.
- CDS Hooks is the complementary standard for triggering point-of-care decision support (e.g., "patient has diabetes and no DR screening on file this year" → surface CardioRetina AI at the moment of the encounter).
- **Implication:** `fhir_service.py` becomes a SMART-on-FHIR-capable service (OAuth2 client registration, launch context, scoped resource access) rather than a one-way JSON exporter. `Observation` resources should use LOINC-coded biomarker values; `DiagnosticReport` should reference `Provenance` for auditability.

### 2.6 Imaging ingestion standards
- DICOMweb (STOW-RS for storage, WADO-RS for retrieval, QIDO-RS for query) is the RESTful, cloud-native counterpart to classic DIMSE services (C-STORE, C-GET, C-FIND) and is what modern cloud health-imaging platforms are standardizing on for SaaS-hosted ingestion.
- Classic DICOM C-STORE / hot-folder watching remains necessary for compatibility with existing on-prem fundus cameras and PACS that only speak DIMSE.
- **Implication:** ship both. DICOMweb is the primary/preferred path for new integrations; the C-STORE SCP listener and hot-folder watcher are retained as a compatibility layer.

### 2.7 MLOps & post-market surveillance
- Clinical AI monitoring best practice tracks data drift (input distribution shift), model/output drift (prediction vs. ground truth divergence), calibration, and **fairness drift** (performance disparities across demographic subgroups), with pre-set triggers for retraining/recalibration review.
- **Implication:** a drift/fairness monitoring service is a first-class backend component (§5.7), not a "nice to have," and its outputs feed directly into the PCCP change log.

### 2.8 Security & compliance baseline
- HITRUST CSF (19 control domains, unifies 60+ regulations/standards) is the de facto enterprise healthcare security certification target; SOC 2 Type II is the baseline expected by hospital procurement/security review teams.
- 2025-era HIPAA technical-safeguard expectations: mandatory AES-256 encryption of ePHI at rest and in transit, FIPS-compliant crypto, Zero Trust network architecture (no implicit trust inside the perimeter), enforced MFA for all systems accessing ePHI, and documented third-party/vendor BAAs.
- **Implication:** these are now explicit, named requirements in the architecture (§5.8), not something implied by "add an audit log."

---

## 3. Differentiation Statement (What Makes This Not a Copy)

1. **Multi-disease oculomics triage from one scan**, architected as a pluggable risk-module registry (DR + CVD at launch; CKD/stroke as validated add-ons) — not a single fixed CVD score bolted onto a DR screener.
2. **Clinician-in-the-loop CDS positioning**, not autonomous diagnosis — faster path to real-world deployment, and an honest match to current CVD-from-retina evidence maturity, with autonomous clearance as a deliberate future milestone rather than a launch requirement.
3. **Explainable-by-default output.** Every risk score ships with the biomarkers that drove it, a confidence/uncertainty band, and a visual attribution overlay — replacing the flat static PDF that every competitor currently ships.
4. **Dual-protocol zero-touch ingestion** (DICOMweb for modern/cloud integrations, DICOM C-STORE + hot-folder for legacy hardware) — most competitors support only one manual upload path or a single proprietary camera.
5. **Real EHR embedding** via SMART on FHIR + CDS Hooks, not a one-way FHIR export stub — the product can launch from inside Epic/Cerner at the point of care.
6. **PCCP-ready MLOps from day one** — versioned risk modules, drift/fairness monitoring, and change logs structured to fit a future FDA Predetermined Change Control Plan submission, so the product has a credible continuous-improvement story instead of "frozen forever" or "silently changes."
7. **A governed change-control process for the ML pipeline** (§7.1) plus a named foundation-model evolution track (v2, §7.2) using self-supervised retinal pretraining (RETFound-style) — so the product can genuinely improve accuracy over time, with every change benchmarked, versioned, and signed off, rather than either frozen forever or silently changed.

---

## 4. Regulatory & Quality Strategy (Non-Binding Technical/Process Guidance)

> This is engineering/product strategy informed by publicly available regulatory guidance, not legal advice. Any real submission strategy should be confirmed with qualified regulatory counsel and a notified body / FDA pre-submission (Q-Sub) meeting.

- **Positioning:** launch as clinician-facing CDS software. Under the FDA's Clinical Decision Support software framework and 21st Century Cures Act carve-outs, software that displays recommendations and underlying evidence to a clinician (rather than an autonomous diagnostic output a patient/non-specialist acts on directly) can sit in a different, generally lighter regulatory tier than autonomous diagnostic devices like LumineticsCore. Confirm classification with counsel before market claims are finalized.
- **Quality system scaffolding to introduce alongside code:**
  - ISO 13485-aligned QMS documentation (design history file, design controls).
  - ISO 14971 risk management file (hazard analysis for each risk module).
  - IEC 62304 software lifecycle artifacts (software safety classification, verification/validation plan) — the ML pipeline and the new backend services should each have their own IEC 62304 classification, since the assurance requirements differ.
  - A living **PCCP draft** maintained from the first model version, even before any submission is planned — this is far cheaper to build incrementally than to reconstruct retroactively.
- **International:** if EU deployment is in scope, plan for MDR classification review and a CE-marking track in parallel; do not assume a US clearance transfers.

---

## 5. Updated Backend Architecture

### 5.1 Multi-Tenancy & Data Layer
- Keep `org_id`-scoped queries as the application-level control, but add **PostgreSQL Row-Level Security (RLS) policies** on `patients`, `visits`, `analyses`, and `audit_log` as defense-in-depth — application bugs should not be the only thing standing between one hospital's data and another's.
- Async SQLAlchemy 2.0 (`create_async_engine` + `asyncpg`) as originally planned.
- All PHI-bearing columns encrypted at rest via envelope encryption (KMS-managed data key per tenant where feasible).

### 5.2 Auth, RBAC & Compliance Logging
- JWT + `passlib[bcrypt]` + `python-jose` as originally planned, with scopes aligned to SMART on FHIR scope conventions where the two systems interact.
- MFA required for any account with access to PHI (`ADMIN`, `DOCTOR`, `TECHNICIAN` roles all qualify).
- `audit_log` is **append-only and hash-chained** (each row includes a hash of the previous row) so tampering is detectable, not just logged — this is the difference between a HIPAA audit log that satisfies a checkbox and one that would hold up under a real HITRUST/SOC 2 assessment.

### 5.3 Zero-Touch Ingestion (Dual Protocol)
- **DICOMweb (primary, cloud-native path):** implement STOW-RS (store), WADO-RS (retrieve), and QIDO-RS (query) endpoints — this is the modern integration surface for any camera/PACS vendor or cloud health-imaging platform that speaks DICOMweb.
- **DICOM C-STORE SCP + hot-folder watcher (compatibility path):** retained exactly as originally planned (`pynetdicom` listener, `watchdog` hot-folder monitor) for on-prem fundus cameras/PACS that only speak classic DIMSE.
- `pydicom`-based metadata extraction feeds both paths through the same internal ingestion contract, so downstream code doesn't care which protocol the image arrived through.

### 5.4 EHR Interoperability
- `fhir_service.py` evolves into a SMART-on-FHIR-capable module: OAuth2/OIDC client registration, launch-context handling, and scoped resource access — not just JSON generation.
- `Observation` resources use LOINC-coded values for biomarkers (AVR, vessel density, tortuosity, branching angle); `DiagnosticReport` resources reference `Provenance`.
- CDS Hooks service added so hospital EHRs can trigger CardioRetina AI at the point of care (e.g., "diabetic patient, no DR screening this year") rather than only receiving results after the fact.

### 5.5 Real-Time Events & Task Queue
- WebSocket hub and Celery/Redis architecture as originally planned (`job_queued`, `step_progress`, `analysis_completed`, `critical_alert`), with priority queues (`stat_queue` vs `routine_queue`).

### 5.6 ML Pipeline Interface (Not the Pipeline Itself)
- The v1 pipeline (in whatever change-controlled version is currently promoted) is called through a stable internal interface that returns a **versioned result object** (model version, risk-module versions, confidence/uncertainty per output) — this is what makes drift monitoring and PCCP documentation possible regardless of how often the underlying models are improved.

### 5.7 MLOps: Drift & Fairness Monitoring (New)
- A dedicated service (`app/services/model_monitoring.py`) that tracks, per risk module: input data drift (distribution shift vs. training baseline), output/prediction drift, calibration, and fairness metrics across available demographic strata.
- Findings feed a versioned changelog that doubles as the evidence base for a future PCCP submission.
- This service **observes** the pipeline's outputs at whatever version is currently promoted; it never modifies pipeline behavior itself — it's the signal that tells you *when* a change-controlled improvement in §7.1 might be warranted.

### 5.8 Security & Compliance Baseline (New)
- Zero Trust network segmentation between ingestion, application, task-queue, and database tiers.
- Secrets/keys managed via a KMS/secrets manager, not environment files, in any production deployment.
- SBOM generation and dependency scanning in CI.
- Target compliance posture: SOC 2 Type II baseline, HITRUST CSF alignment as the enterprise/hospital-procurement target, documented BAAs for any subprocessor.

### 5.9 Observability
- Structured logging + OpenTelemetry tracing across API, task queue, and ML inference boundaries, so a slow or failed analysis can be traced end-to-end — this is standard for anything sold into hospital IT environments, which will ask for it during procurement security review.

### 5.10 Configuration & Hyperparameter Management (New)
The Aug 2026 audit found several pipeline-critical values hard-coded in source rather than externalized — this makes them harder to review, version, and benchmark as part of the §7.1 change-control gate. The following move to a versioned YAML config (`backend/ml/config/`), loaded by `pipeline_gateway.py`, with the current hard-coded values preserved as the `v1-baseline` defaults so this is a refactor, not a behavior change:

| Parameter Group | Current (hard-coded) | Config Fields |
|---|---|---|
| Quality gate | Fixed 0.5 threshold | `quality.threshold` (calibrated against gradable/ungradable prevalence), `quality.temperature_scaling` |
| Vessel post-processing | Fixed morphological ops | `vessel.min_object_size`, `vessel.hole_fill_area`, `vessel.skeletonization_method` |
| A/V fusion | Heuristic fusion in `AVFusion` | `av_fusion.weights`, `av_fusion.artery_prob_threshold`, `av_fusion.vein_prob_threshold`, `av_fusion.crf_refinement` |
| Biomarker calculation | Fixed formulas | `biomarkers.etdrs_zone` (Zone B/C/D definitions), `biomarkers.avr_caliper_method`, `biomarkers.tortuosity_metric` (chain code vs. Fourier variant) |
| Risk classification | Hard-coded bands (≤2 LOW, 3–6 MODERATE, ≥7 HIGH) | `risk.factor_weights`, `risk.band_thresholds` (subject to Youden-index optimization on a validation cohort) |
| DR referral threshold | `argmax` (hard decision) | `disease.referable_dr_grade` (default: Grade ≥2), `disease.sensitivity_specificity_tradeoff` |

**Rules:**
- Every field carries a version tag; the currently-active config version is part of the versioned result object (§5.6), so a threshold change is visible to drift monitoring (§5.7) exactly like a weights change.
- Any edit to a config value follows the same §7.1 promotion gate as a code/weights edit — a threshold change is a clinical-behavior change, not a "just config" exception.
- Config files themselves are checked into version control alongside `compliance/pccp/model_changelog.md`, never edited in a running deployment.

---

## 6. Target Directory & File Structure (Updated)

```
cardioretina-main/
├── documents/
│   ├── build.md
│   └── prompt.md
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py                  # async engine + RLS session context
│   │   │
│   │   ├── api/v1/
│   │   │   ├── auth.py
│   │   │   ├── dicom.py                 # legacy DIMSE-facing endpoints
│   │   │   ├── dicomweb.py              # [NEW] STOW-RS / WADO-RS / QIDO-RS
│   │   │   ├── websockets.py
│   │   │   ├── cds_hooks.py             # [NEW] CDS Hooks service endpoints
│   │   │   └── smart_fhir.py            # [NEW] SMART on FHIR launch/auth
│   │   │
│   │   ├── core/
│   │   │   ├── security.py
│   │   │   ├── rbac.py
│   │   │   ├── dicom_parser.py
│   │   │   └── audit_chain.py           # [NEW] hash-chained append-only log writer
│   │   │
│   │   ├── services/
│   │   │   ├── ingestion_watcher.py
│   │   │   ├── dicom_scp_server.py
│   │   │   ├── fhir_service.py          # now SMART-capable
│   │   │   └── model_monitoring.py      # [NEW] drift/fairness monitoring
│   │   │
│   │   ├── ml_interface/
│   │   │   └── pipeline_gateway.py      # [NEW] stable, versioned contract into ml/
│   │   │
│   │   └── tasks/
│   │       ├── celery_app.py
│   │       └── analysis_task.py
│   │
│   └── ml/                              # v1 — change-controlled, see §7 (edits allowed via the gate, not silent)
│       ├── pipeline/main_pipeline.py
│       ├── models/{quality,vessel,av,disease}/
│       ├── features/biomarkers.py
│       ├── risk/
│       │   ├── risk_engine.py           # v1 rule-based (change-controlled)
│       │   └── risk_engine_ml/          # [NEW, gated — see §7.3] calibrated GBM/NN candidate track
│       ├── config/                      # [NEW, see §5.10] versioned YAML thresholds/params, v1-baseline = current hard-coded values
│       ├── weights/
│       └── v2_foundation/               # [NEW, gated, shadow-mode only — see §7.2]
│
├── compliance/                          # [NEW]
│   ├── qms/                             # ISO 13485-aligned design history file
│   ├── risk_management/                 # ISO 14971 hazard analyses per risk module
│   ├── software_lifecycle/              # IEC 62304 artifacts
│   └── pccp/                            # living PCCP draft + model changelog
│
└── frontend/                            # see §8
```

---

## 7. ML Pipeline: Change-Control Policy & Evolution Tracks

### 7.1 v1 — Baseline, Change-Controlled (Not Frozen)
The original "zero edits, ever" rule is replaced with a **change-control gate**. Direct edits to the files below are permitted — including formulas, weights loading, model definitions, threshold logic, and inference math — whenever there's a documented case for improving accuracy, calibration, or clinical safety. What's non-negotiable is the *process* the edit goes through, not a ban on the edit itself:

| System Component | Status | Modification Policy |
|---|---|---|
| `ml/models/quality/` | **Change-controlled** | Edits permitted (e.g., retrained MobileNetV3 weights, revised preprocessing) — must clear the promotion gate below |
| `ml/models/vessel/` | **Change-controlled** | Edits permitted (e.g., retrained U-Net++ on Fundus-AVSeg per §11) — must clear the promotion gate below |
| `ml/models/av/` | **Change-controlled** | Edits permitted (A/V classification & fusion logic) — must clear the promotion gate below |
| `ml/models/disease/` | **Change-controlled** | Edits permitted (e.g., retrained EfficientNet-B3, revised DR grading) — must clear the promotion gate below |
| `ml/features/biomarkers.py` | **Change-controlled** | AVR, density, tortuosity, branching angle formulas may be revised — must clear the promotion gate below |
| `ml/risk/risk_engine.py` | **Change-controlled** | Threshold/weight revisions to the *existing rule-based* logic follow this gate. Replacing rule-based scoring with a trained model is a separate, higher-bar track — see §7.3 |
| `ml/pipeline/main_pipeline.py` | **Change-controlled** | Execution order/steps may be revised — must clear the promotion gate below |

**Promotion gate (applies to every edit in this table, no exceptions):**
1. The change is made on a branch/candidate, never directly against what's serving production traffic.
2. The candidate is benchmarked against the current production baseline on the same fixed, version-controlled held-out test set (golden-output regression test, §10) — results are recorded, not just eyeballed.
3. A documented rationale (what changed, why, expected effect) and the benchmark comparison are written to `compliance/pccp/model_changelog.md` before promotion.
4. A named sign-off (clinical/technical reviewer) is recorded alongside the changelog entry.
5. The pipeline gateway's versioned result object (§5.6) reflects the new version immediately on promotion, so drift monitoring (§5.7) and audit trails pick up the change automatically — there is never a version bump that monitoring doesn't see.

This is deliberately the same discipline as an FDA PCCP submission (§2.4) — the goal is that this changelog is *already* the evidence package if a real PCCP submission is ever pursued, not a retrofit.

### 7.2 v2 — Foundation-Model Track (Larger Architectural Changes)
The change-control gate in §7.1 covers incremental improvements to the existing architecture (retrained weights, revised thresholds, expanded training data). For a larger architectural shift — e.g., moving to self-supervised retinal pretraining (RETFound-style) instead of from-scratch CNNs per task — the same gate applies, but with a longer, mandatory **shadow-mode evaluation period** before promotion is even considered, given the larger blast radius of an architecture change versus a weights refresh:
- Runs in shadow mode against live inputs for a defined evaluation window — its outputs are logged for comparison and do not reach a clinician or patient record during this window.
- Promotion still requires everything in the §7.1 gate (candidate benchmarking, changelog, sign-off, version bump) *plus* a documented equivalence-or-better clinical validation study, since an architecture change carries more uncertainty than a weights refresh.
- This track exists so the project has a legitimate "research-level" story without ever violating the v1 immutability guarantee that clinical validation depends on.

### 7.3 Risk Engine ML Overhaul (New — Distinct Track from §7.1/§7.2)
The Aug 2026 audit flagged the risk engine specifically: `risk_engine.py`'s hand-crafted threshold scoring (AVR/tortuosity/DR-grade/clinical-factor checks against fixed bands) does not generalize the way a calibrated, outcome-trained model would, and is the component furthest from research standard relative to the rest of the pipeline. This is a distinct workstream from a weights refresh (§7.1) or an imaging-backbone architecture change (§7.2), because the input/output contract and the required evidence are different:

- **Target model:** a calibrated gradient-boosted model (XGBoost/LightGBM) or shallow neural net, trained on:
  - **Inputs:** the 4 vessel biomarkers (AVR, density, tortuosity, branching angle) + DR grade + available clinical data (age, blood pressure, blood glucose, cholesterol, diabetes history).
  - **Targets:** 5-year MACE incidence from UK Biobank outcome-linked data (§11.2), or a surrogate outcome (CAC score, carotid IMT) where MACE follow-up is unavailable.
- **Required evidence before promotion (in addition to the §7.1 gate):** calibration plot, Brier score, and NRI/IDI versus a named standard risk score (PCE, Framingham, or QRISK3, per §13.3) — AUC alone does not clear this gate. This mirrors the §7.2 requirement for a documented equivalence-or-better clinical validation study, because replacing the scoring logic entirely carries similar blast radius to a backbone change, even though the imaging models are untouched.
- **Status:** rule-based `risk_engine.py` remains the sole production scoring path until an ML candidate clears this gate. `risk_engine_ml/` outputs are shadow-only (same isolation guarantee as §7.2) until promoted, and promotion still requires the version bump to surface through `pipeline_gateway.py` immediately, per §7.1 step 5.
- **Dependency:** this track cannot start in earnest until UK Biobank access (§11.2, gated, longest lead time per §14) is secured — it is the critical-path item for the whole risk-module accuracy story, not just a nice-to-have refinement.

---

## 8. Frontend (Updated)

Aesthetic direction from v1 is kept — Shadcn UI, Tailwind, dark slate glassmorphism (`#090d16`), WebGL/Canvas shader components — with two additions:

- **Explainability visuals as a first-class feature, not decoration.** The `RiskRadarShader` and `VesselGlowOverlay` components should render actual model attribution (which vessels/regions drove the biomarker values), not a purely aesthetic gauge — this is what makes the WebGL work a genuine differentiator against competitors' static PDFs rather than a skin.
- **Clinical UX standards:** WCAG 2.1 AA accessibility compliance (this is standard procurement criteria for hospital software), and alert-fatigue-aware design for `critical_alert` events (rate-limited, severity-tiered, dismissible-with-reason) rather than an unconditional pop-up per event.

All previously planned pages, components, and stores (Dashboard, QueueMonitor, NewAnalysisWizard, AnalysisStatus, MaskSplitSlider, authStore/tenantStore/wsStore) remain as specified in v1, extended to surface risk-module versioning and confidence/uncertainty per the updated pipeline contract.

---

## 9. End-to-End Workflow (Updated)

```mermaid
sequenceDiagram
    autonumber
    participant Camera as Fundus Camera / PACS
    participant Ingest as DICOMweb (STOW-RS) / C-STORE SCP / Hot-Folder
    participant API as FastAPI Async Gateway
    participant Queue as Redis / Celery Task Queue
    participant Gate as ML Pipeline Gateway (versioned contract)
    participant ML as v1 Pipeline (change-controlled) + shadow v2, if enabled
    participant Mon as Drift/Fairness Monitoring
    participant DB as Async PostgreSQL (RLS-enforced)
    participant WS as WebSocket Hub
    participant UI as Shadcn UI Clinical Dashboard
    participant EHR as Hospital EHR (SMART on FHIR + CDS Hooks)

    Camera->>Ingest: Push image (DICOMweb STOW-RS or C-STORE / network share)
    Ingest->>API: Auto-ingest (extract metadata & pixels)
    API->>DB: Async create Patient, Visit, Analysis (status="pending", RLS-scoped)
    API->>Queue: Dispatch run_analysis_pipeline.delay(job_id)
    API-->>WS: Broadcast "job_queued"

    Queue->>Gate: MainPipeline.run(image_path, clinical_data)
    Gate->>ML: Execute currently-promoted v1 (change-controlled); shadow v2 runs in parallel if enabled
    ML-->>Gate: Versioned result (biomarkers, DR grade, risk-module outputs, confidence)
    Gate-->>Mon: Log inputs/outputs for drift & fairness tracking

    Queue->>DB: Save metrics, masks, generated report
    Queue->>WS: Broadcast "analysis_completed" (job_id, risk_level, model_version)

    alt Risk Level is HIGH
        WS->>UI: Urgent visual alert (rate-limited, dismissible-with-reason)
    end

    UI->>API: Fetch record, render WebGL viewer with attribution overlay
    API->>EHR: SMART-on-FHIR DiagnosticReport + Observation (LOINC-coded); CDS Hooks card available at point of care
```

---

## 10. Verification Checklist (Updated)

- [ ] All PyTorch `.pth` weight loading remains completely intact in `backend/ml/weights/`.
- [ ] Any change to `backend/ml/` is benchmarked against the previously-promoted baseline on the fixed golden test set, with results and rationale logged in `compliance/pccp/model_changelog.md` and a recorded sign-off, *before* promotion — no undocumented or silent edits.
- [ ] DICOMweb (STOW-RS/WADO-RS/QIDO-RS) and legacy DICOM C-STORE/hot-folder ingestion both extract metadata and pixels cleanly.
- [ ] WebSockets broadcast live status updates during analysis execution.
- [ ] Row-Level Security policies verified to block cross-tenant reads/writes independent of application-layer `org_id` filtering.
- [ ] Audit log hash-chain verified tamper-evident (modifying any row breaks the chain).
- [ ] SMART-on-FHIR launch flow and CDS Hooks card tested against at least one reference EHR sandbox.
- [ ] Drift/fairness monitoring service produces baseline metrics and a changelog entry for the current model version.
- [ ] Shadcn UI components render with WebGL shaders that reflect real attribution data, not placeholder animation.
- [ ] Frontend passes WCAG 2.1 AA automated accessibility checks.
- [ ] Multi-tenant organization scoping enforced across patient and visit APIs at both application and database layers.
- [ ] v2 foundation-model track (if enabled) confirmed shadow-only, with no path for its output to reach a clinician without an explicit promotion sign-off recorded in `compliance/pccp/`.

---

## 11. ML Training & Dataset Strategy

This section governs the **training track** (producing candidate model versions). Training work happens in a separate workspace and produces a *candidate* version — editing the files in `backend/ml/` directly is permitted per the §7.1 change-control gate, but the training/experimentation itself still happens off to the side so a half-finished experiment never becomes what serves production traffic. Every candidate, however produced, goes through the same §7.1 promotion gate before it replaces anything live.

### 11.1 Why accuracy work is a dataset problem first
Every public artery/vein (A/V) classification dataset is small — 22 to 100 images each. That, not architecture choice, is the binding constraint on AVR/vessel-biomarker accuracy, which directly feeds the CVD risk module. DR grading has larger public datasets but with real domain shift (different cameras, populations, label protocols) across each.

### 11.2 Datasets by task

| Task | Dataset | Size | Notes |
|---|---|---|---|
| DR grading (pretrain) | EyePACS | 88,702 images / 44,351 patients | Largest, most diverse; noisy labels — pretrain/self-supervised use, not fine-grained fine-tuning |
| DR grading (fine-tune) | APTOS 2019 | 3,662 labeled | ICDR 0–4, Aravind Eye Hospital (India) |
| DR grading (fine-tune) | DDR | 13,673 images | Includes lesion masks + an "ungradable" class — useful for the quality-check stage too |
| DR grading (fine-tune) | IDRiD | 516 images | Ultra-high-res, skews moderate/severe, has lesion-level annotations |
| DR grading (fine-tune) | Messidor-2 | 1,748 images | Well-established French reference standard |
| Vessel segmentation | DRIVE, STARE, CHASE_DB1, HRF | 20–45 images each | Standard field benchmarks |
| A/V classification | RITE / AV-DRIVE | 40 images | Pixel-wise A/V labels |
| A/V classification | HRF-AV | 45 images | Pixel-level annotations |
| A/V classification | LES-AV | 22 images | High-res, optic-disc-centered |
| A/V classification | INSPIRE-AVR | 40 images | Centerline-only — evaluation, not training |
| A/V classification | **Fundus-AVSeg (2025)** | **100 images** | **Newest, highest-resolution, ophthalmologist-annotated — primary A/V fine-tuning set going forward** |
| CVD outcome validation | **UK Biobank** | 89,894 images / 44,176 participants | **Gated — formal application + ethics approval required.** Linked to real follow-up CVD outcomes (a 2024 cohort study used a 52,297-image subset with 5-year MACE incidence). This is what validates the risk engine's calibration, not just the imaging model's accuracy. |

### 11.3 Recommended training pipeline
1. **Pretrain** on the large unlabeled/weakly-labeled pool (EyePACS-scale), preferably via self-supervised pretraining (masked-autoencoder style, per the RETFound line of work referenced in §2.3) rather than training each task from scratch.
2. **Fine-tune DR grading** on the combined APTOS + DDR + IDRiD + Messidor-2 set (matching the multi-dataset-combination pattern used in current literature to reduce single-source camera/population bias), with label smoothing and an ensemble of fold checkpoints. Held out for benchmarking: fixed test splits within APTOS + DDR + Messidor-2.
3. **Fine-tune A/V classification** on the combined RITE + HRF-AV + LES-AV + Fundus-AVSeg set, with Fundus-AVSeg weighted as the primary signal given its resolution and annotation quality, plus an auxiliary vessel-segmentation loss term. Held out for benchmarking: the Fundus-AVSeg 20-image test split — this is currently the single biggest accuracy bottleneck in the pipeline (§14.3), since every public A/V dataset is small (22–100 images).
4. **Retrain the quality-check and vessel-segmentation stages** on DDR's "ungradable" class + EyePACS (quality) and with deep supervision + Dice/BCE loss + test-time augmentation (vessel), each benchmarked against its own held-out set (DDR/EyePACS split for quality; DRIVE/STARE/CHASE_DB1/HRF held-out for vessel).
5. **Train and validate the risk-engine ML candidate** (§7.3) on the biomarker/DR-grade/clinical-data inputs against UK Biobank outcome labels (or a surrogate outcome where MACE follow-up is unavailable) — report calibration, Brier score, and NRI/IDI vs. PCE/QRISK3 per §13.3. This is a distinct validation track from 1–4: it evaluates the *scoring* logic, not the imaging models, and follows the §7.3 gate rather than §7.1 alone.
6. Every candidate produced by this pipeline — imaging model or risk-engine — is versioned, benchmarked against the currently-promoted production model on its fixed held-out set, and logged to `compliance/pccp/model_changelog.md` — promotion follows the §7.1 gate (an accuracy-improved refresh of the current architecture), the §7.2 gate (a foundation-model architectural change), or the §7.3 gate (a risk-engine model-class change), whichever applies.

### 11.4 Artery/Vein Visualization Feature
The vessel segmentation (U-Net++) and A/V classification/fusion stages already planned in the v1 pipeline produce the information needed for this — what's been missing is making that output a concrete, stored, displayable artifact rather than an intermediate array used only for biomarker math.

**New explicit pipeline requirement:** the A/V fusion stage must emit a **color-coded overlay image** (arteries and veins rendered in distinct, clinically-conventional colors over the original fundus photograph, at the original image resolution) as a first-class output artifact of every analysis — alongside the existing raw fundus image and vessel-only mask.

**Storage & delivery:**
- All three images (raw fundus, vessel-only mask, A/V color overlay) are stored per-analysis in the existing pluggable object storage layer (Local/MinIO/S3) and referenced from the `analyses` record.
- Served to the frontend via signed URLs scoped by the existing RLS/`org_id` tenant boundary — no change to the auth model needed.

**Frontend:**
- `MaskSplitSlider.tsx` (already planned in §8) becomes the primary viewer: doctor drags between Raw Fundus / Vessel Mask / A/V Overlay for the image they just uploaded.
- `VesselGlowOverlay.tsx` (already planned) renders the same A/V overlay data as an interactive canvas layer — hovering a vessel segment can surface its classification confidence, consistent with the explainability requirement in §5.6/§8.
- No new component category is needed — this closes the gap between what was already specified and what the pipeline actually outputs.

---

## 13. Research Publication Strategy

Everything in this section exists because "industry standard" and "publishable" are different bars, and retrofitting the second onto a finished product is where most industry AI papers fail at peer review. This is written into the architecture now, not added before submission.

### 13.1 Honest positioning against closest prior art
A paper's related-work section has to differentiate honestly or reviewers who know the field will do it for you, unfavorably. Two findings should directly shape the claims this project is allowed to make:
- **Multi-task DR+systemic-risk learning is not novel by itself** — a 2026 pilot study already demonstrates hard-parameter-sharing multi-task retinal imaging for systemic risk stratification in type 2 diabetes. CardioRetina AI's contribution has to be in scale, prospective/multi-site validation, population, fairness rigor, or explainability validation — not "we also did multi-task learning."
- **Retina-alone CVD risk models tend to match, not beat, traditional risk scores.** A 2025 *Cardiovascular Diabetology* study found a retina-only deep learning model performed comparably to the Pooled Cohort Equations (AUC 0.697 both), and only exceeded it (AUC 0.728) when the retinal score was *fused* with PCE and a polygenic risk score. **Do not design the risk engine's validation study to claim "replaces" a standard risk score. Design it to test incremental discrimination when fused with one** — that is the defensible, citable claim.
- **Population is a genuine differentiator.** The dominant outcome-linked dataset in this literature (UK Biobank) is overwhelmingly European-ancestry. External validation on an underrepresented population (e.g., South Asian/Indian cohorts, depending on deployment site) is a real contribution, not incremental re-validation.

### 13.2 Reporting-guideline compliance (built in from day one)
- **TRIPOD+AI** (BMJ 2024, 27-item checklist) — the reporting standard for AI/ML-based multivariable prediction models. Governs how model development, tuning, calibration, and fairness must be documented.
- **STARD-AI** — the diagnostic-accuracy-study equivalent, relevant for the DR-grading component specifically.
- **PROBAST+AI** (BMJ 2025) — the risk-of-bias and applicability assessment tool reviewers now use to grade AI prediction-model submissions; treat every held-out evaluation as if it will be scored against this.
- **DECIDE-AI** (*Nature Medicine* 2022) — governs early-stage clinical evaluation of AI decision-support systems actually used in a live workflow; relevant once the product is piloted in a real clinic, and a natural fit for a second, implementation-focused paper.
- **CONSORT-AI / SPIRIT-AI** — required if any prospective clinical trial of the deployed system is run.
- **Practical implication:** every model version's training split, validation split, and held-out test split are logged with patient-level provenance (never image-level leakage across splits), every reported metric ships with a 95% confidence interval, and every dataset combination documents inclusion/exclusion criteria — from the first training run, not the one before submission.

### 13.3 Statistical rigor requirements
- Report discrimination (AUC with 95% CI) **and** calibration (calibration plots, Brier score) — AUC alone is not sufficient for a risk-prediction paper in 2026.
- For the CVD risk module specifically: report **Net Reclassification Improvement (NRI)** and **Integrated Discrimination Improvement (IDI)** versus a standard clinical risk score (PCE, Framingham, or QRISK depending on target population) — this is the standard evidentiary bar for "does this add value" in cardiovascular risk-model literature, and most retina-CVD papers that skip it get challenged on it.
- External validation on a site/population genuinely held out from training (different hospital, different camera vendor, different population) is required before any accuracy claim is publishable — internal cross-validation numbers are not sufficient.
- Preregister the validation study's protocol and statistical analysis plan (e.g., via OSF) **before** unblinding results — this single step meaningfully strengthens credibility and is increasingly expected by top venues.

### 13.4 Fairness & bias audit (first-class, prespecified — not a compliance afterthought)
- Documented precedent for real harm exists: a 2021 study found DR-detection accuracy of 73.0% for lighter-skin patients vs. 60.5% for darker-skin patients under an induced training-data imbalance scenario. Separately, a study demonstrated that racial identity can be predicted from black-and-white retinal vessel segmentations alone — meaning demographic signal can leak through the exact vessel features CardioRetina AI's AVR/CVD biomarkers depend on, a genuine confounding risk that must be tested, not assumed away.
- **Design a prespecified fairness audit protocol** (subgroup-stratified sensitivity/specificity/calibration across race, sex, age, and skin-tone proxies where ethically collectible) as its own study, registered before analysis, using the model_monitoring.py fairness-drift infrastructure already specified in §5.7 as the measurement substrate.
- No commercial or academic group has published a rigorous fairness audit specifically for a *joint* DR+CVD oculomics model — this is a genuine, citable gap this project is positioned to fill because the module architecture (§1) already treats risk modules as independently measurable.

### 13.5 Explainability validated against clinician agreement
- Generating attribution overlays (the A/V visualization work in §11.4) is necessary but not sufficient for a methods paper — the missing, rarer, more valuable step is **measuring whether real ophthalmologists/cardiologists agree with the model's attribution**, not just displaying it.
- Design a structured clinician-agreement study: a panel of clinicians reviews attribution overlays blinded to the model's risk score, rates agreement/plausibility, and those ratings are reported as a metric alongside standard accuracy figures. This is rare in the retinal-AI literature and directly strengthens both the clinical-trust case and the publication case.

### 13.6 Reproducibility & data/code release plan
- Top venues (npj Digital Medicine, Lancet Digital Health, JAMA Ophthalmology) increasingly require code and data availability statements. Plan for: a public model card (architecture, training data provenance, intended use, known limitations, fairness audit summary), a code release of the training pipeline (§11) separate from any proprietary inference deployment code, and, where licensing permits, a de-identified benchmark subset or clearly documented data-access instructions (UK Biobank access is gated and must be described accurately, not implied as open).

### 13.7 New Directory: `research/`
```
research/
├── protocol/                # preregistered validation study protocol + statistical analysis plan
├── reporting_checklists/     # completed TRIPOD+AI, STARD-AI, PROBAST+AI, DECIDE-AI checklists per study
├── fairness_audit/           # prespecified subgroup audit protocol + results
├── explainability_study/     # clinician-agreement study design + results
├── model_card.md
└── data_availability.md
```

---

## 14. Implementation Status & Roadmap (Aug 2026 Audit)

This section exists so the gap between "the plan" (§1–§13) and "what's actually built" is explicit and doesn't have to be reconstructed from git history. It reflects a point-in-time audit and should be updated whenever a phase closes, not left stale.

### 14.1 Current state by component

| Component | Implementation | Status |
|---|---|---|
| Backend API | FastAPI, SQLAlchemy, Celery (eager mode) | ✅ Working |
| ML pipeline | 4 models chained: Quality → Vessel → A/V → Disease → Biomarkers → Risk | ✅ Working |
| Models | MobileNetV3 (quality), U-Net++ (vessel), U-Net++ (A/V), EfficientNet-B3 (disease) | ✅ Loaded |
| Frontend | React 19, TypeScript, Vite, Shadcn UI, Tailwind | ✅ Basic structure |
| Database | SQLite (sync) | ⚠️ Placeholder — needs async PostgreSQL + RLS per §5.1 |
| Compliance | No `compliance/` directory yet | ❌ Phase 0 pending |
| Interoperability | No DICOMweb, SMART on FHIR, or CDS Hooks yet | ❌ Phases 2–3 pending |
| Observability | Print statements only | ❌ Not implemented — §5.9 pending |
| Config/hyperparameters | Hard-coded in source | ❌ §5.10 pending |
| Risk engine ML track | Not started | ❌ §7.3 pending, blocked on UK Biobank access |

**Overall: research-grade plan, ~30% implemented** (backend ML pipeline + basic frontend exist; infrastructure, compliance, interoperability, and the research workspace do not yet).

### 14.2 Phase priority & effort estimate

| Phase | Task | Priority | Effort |
|---|---|---|---|
| 0 | Compliance scaffolding (QMS, risk, lifecycle, PCCP) + `model_changelog.md` baseline | 🔴 Critical | 1.5–2.5 days |
| 1 | Async PostgreSQL + RLS + Alembic migrations; hash-chained audit log | 🔴 Critical | 4–7 days |
| 2 | JWT + MFA + RBAC; DICOMweb; legacy DICOM C-STORE + hot-folder | 🔴/🟡 | 9–13 days |
| 3 | Celery/Redis production mode; WebSocket hub; `pipeline_gateway.py`; SMART on FHIR + CDS Hooks; `model_monitoring.py` | 🔴/🟡/🟢 | 13–19 days |
| 4 | Shadcn UI + glassmorphism; WebGL shaders; WCAG 2.1 AA + alert-fatigue-aware alerts | 🟡/🟢 | 10–15 days |
| 5 | A/V color overlay output + storage + `MaskSplitSlider` | 🟡 | 3–5 days |
| 6 | Training workspace + dataset ingestion + pretraining pipeline | 🟢 | 10–15 days |
| 7 | Full verification checklist | 🔴 Critical | 3–5 days |

Note: §5.10 (config externalization) and §7.3 (risk-engine ML track) are new in this revision and are not yet effort-estimated in the table above — §5.10 is a small addition to Phase 3 (pipeline gateway work); §7.3 is scoped separately in §14.3 below because it's gated on external data access, not engineering effort alone.

### 14.3 Path to publication-ready

1. Complete Phases 0–3 (infrastructure, compliance, interoperability) — approx. 3–4 weeks.
2. Execute Phase 6 (multi-dataset fine-tuning, GPU-dependent) — approx. 2–3 weeks.
3. Execute Phase 8 (research workspace, preregistration, checklists) — approx. 1–2 weeks.
4. Secure UK Biobank access for CVD outcome validation and the §7.3 risk-engine ML track — critical path, 2–6 months; start this in parallel with Phase 0, not after Phase 6.

**Biggest accuracy lever:** A/V classification (§11.1) is the binding bottleneck on CVD-biomarker accuracy given how small every public A/V dataset is. Priority order: Fundus-AVSeg fine-tuning (primary, per §11.3 step 3) → synthetic data generation (vessel-tree domain randomization) → semi-supervised pseudo-labeling on unlabelled fundus images.

**Biggest credibility lever:** the prespecified fairness audit (§13.4) and clinician-agreement study (§13.5) — both are novel in the oculomics literature and directly preempt the objections reviewers are most likely to raise.

### 14.4 Recommended next steps (sequencing)

1. **Week 1:** Phase 0 (compliance scaffolding + `model_changelog.md` baseline) — and file the UK Biobank access application immediately, since it has the longest lead time of anything in this plan.
2. **Weeks 2–3:** Phase 1 (PostgreSQL + RLS + audit chain + Alembic).
3. **Weeks 3–4:** Phase 2 (auth + DICOMweb + legacy ingestion).
4. **In parallel:** stand up the Phase 6 training workspace (data download, preprocessing scripts) and the §5.10 config externalization — both are low-dependency and can proceed alongside Phases 1–2.

---

## 15. Sources Consulted

- FDA De Novo authorization and product summaries for LumineticsCore/IDx-DR, EyeArt, AEYE-DS (ScienceDirect/Ophthalmology Science review; FDA press materials; DEN180001).
- Oculomics scoping reviews and cohort studies (BMJ Open/UK Biobank CVD risk-factor study; Reti-CKD score; Oxford Journal oculomics review; Nature Cardiovascular Research 2026 multi-omic ophthalmic imaging study).
- RETFound and related retinal foundation model papers (Nature 2023; FLAIR; EyeFound; UrFound).
- FDA Predetermined Change Control Plan final guidance (Dec 2024) and Aug 2025 joint update with Health Canada/MHRA.
- SMART on FHIR and CDS Hooks standards documentation and implementation case studies (JAMIA; Microsoft Learn; Duke SMART on FHIR implementation report).
- DICOMweb standard overview and cloud health-imaging platform documentation (AWS HealthImaging, Google Cloud Healthcare API).
- Clinical AI drift/fairness monitoring literature (MMC+/CheXstray framework; AWS SageMaker Model Monitor best practices; health-equity MLOps framework).
- HITRUST CSF overview; 2025 HIPAA technical-safeguard checklist (encryption, Zero Trust, MFA).
