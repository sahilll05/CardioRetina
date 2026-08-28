# CardioRetina AI — Model Changelog (PCCP)

> **Purpose**: Predetermined Change Control Plan (PCCP) changelog, as described in `build.md §2.4` and `§7.1`.
> This file is the authoritative, append-only record of every change to any component of the ML pipeline, including weights, thresholds, biomarker formulas, risk scoring logic, and configuration values.
> Every entry must be written **before promotion** of the candidate, never retroactively.

---

## Changelog Format

Each entry must contain:
- **Version tag** (semantic: `MODULE-vMAJOR.MINOR.PATCH`, e.g., `RISK-v1.0.0`)
- **Date** of promotion (ISO 8601: `YYYY-MM-DD`)
- **Change summary** (what changed and in which files)
- **Rationale** (why the change was made)
- **Validation dataset reference** (which held-out set was used for benchmarking, with a version tag)
- **Benchmark result** (key metric before → after on the fixed held-out set)
- **Sign-off** (full name + role of the clinical/technical reviewer)
- **Config version** (the `v1-baseline` or later config YAML tag active at promotion time)

---

## ─── v1 Baseline (Established 2026-08-28) ───

### Entry: `QUALITY-v1.0.0`

| Field | Value |
|---|---|
| **Version Tag** | `QUALITY-v1.0.0` |
| **Date** | `2026-08-28` |
| **Component** | `ml/models/quality/` — MobileNetV3-Small quality checker |
| **Change Summary** | Initial baseline. Architecture: MobileNetV3-Small backbone, 2-class classifier (576→128→2). Gradability threshold: 0.5 (hard-coded, now externalized to `ml/config/pipeline_v1_baseline.yaml` as `quality.threshold`). |
| **Rationale** | Baseline establishment. No change from original training. |
| **Validation Dataset** | Not yet formally benchmarked on a named held-out set. `DDR/EyePACS-split` designated as the target held-out set for all future §7.1 benchmarks — see `build.md §11.3`. |
| **Benchmark Result** | Baseline not yet recorded. First future §7.1 promotion against this component must establish the baseline metric on the `DDR/EyePACS-split`. |
| **Sign-off** | Sahil Powar (Project Lead) — 2026-08-28 |
| **Config Version** | `v1-baseline` (`ml/config/pipeline_v1_baseline.yaml`) |

---

### Entry: `VESSEL-v1.0.0`

| Field | Value |
|---|---|
| **Version Tag** | `VESSEL-v1.0.0` |
| **Date** | `2026-08-28` |
| **Component** | `ml/models/vessel/` — U-Net++ vessel segmentation |
| **Change Summary** | Initial baseline. Architecture: U-Net++ with filters [32, 64, 128, 256, 512], single output channel (binary vessel mask), 512×512 input. Post-processing parameters externalized to `ml/config/pipeline_v1_baseline.yaml`. |
| **Rationale** | Baseline establishment. |
| **Validation Dataset** | `DRIVE/STARE/CHASE_DB1/HRF-held-out` designated — not yet formally run. |
| **Benchmark Result** | Baseline not yet recorded. |
| **Sign-off** | Sahil Powar (Project Lead) — 2026-08-28 |
| **Config Version** | `v1-baseline` |

---

### Entry: `AV-v1.0.0`

| Field | Value |
|---|---|
| **Version Tag** | `AV-v1.0.0` |
| **Date** | `2026-08-28` |
| **Component** | `ml/models/av/` — U-Net++ 3-class A/V classification + fusion |
| **Change Summary** | Initial baseline. Architecture: shared U-Net++ backbone (same filter sizes), 3-channel output (artery / vein / background), fused with vessel mask via logical AND in `AVFusion.fuse_masks()`. Fusion weights externalized to `ml/config/pipeline_v1_baseline.yaml`. |
| **Rationale** | Baseline establishment. |
| **Validation Dataset** | `Fundus-AVSeg-20-image-test-split` designated — not yet formally run. |
| **Benchmark Result** | Baseline not yet recorded. |
| **Sign-off** | Sahil Powar (Project Lead) — 2026-08-28 |
| **Config Version** | `v1-baseline` |

---

### Entry: `DISEASE-v1.0.0`

| Field | Value |
|---|---|
| **Version Tag** | `DISEASE-v1.0.0` |
| **Date** | `2026-08-28` |
| **Component** | `ml/models/disease/` — EfficientNet-B3 DR grading (0–4) |
| **Change Summary** | Initial baseline. Architecture: EfficientNet-B3 backbone, custom multi-layer classifier (in_features→256→5 with Dropout 0.3 + ReLU), 300×300 input. Referral threshold externalized to `ml/config/pipeline_v1_baseline.yaml` as `disease.referable_dr_grade = 2`. |
| **Rationale** | Baseline establishment. |
| **Validation Dataset** | `APTOS-2019-test-split + DDR-test-split + Messidor-2-test-split` designated — not yet formally run. |
| **Benchmark Result** | Baseline not yet recorded. |
| **Sign-off** | Sahil Powar (Project Lead) — 2026-08-28 |
| **Config Version** | `v1-baseline` |

---

### Entry: `BIOMARKERS-v1.0.0`

| Field | Value |
|---|---|
| **Version Tag** | `BIOMARKERS-v1.0.0` |
| **Date** | `2026-08-28` |
| **Component** | `ml/features/biomarkers.py` — AVR, vessel density, tortuosity, branching angle |
| **Change Summary** | Initial baseline. AVR: distance transform on skeletonized masks. Density: vessel_pixels / total_pixels. Tortuosity: arc_length / chord_length per contour. Branching angle: HoughLines on 3-neighbor skeleton pixels. All parameters externalized to `ml/config/pipeline_v1_baseline.yaml`. |
| **Rationale** | Baseline establishment. |
| **Validation Dataset** | N/A — deterministic geometry computation (no ML weights). |
| **Benchmark Result** | N/A |
| **Sign-off** | Sahil Powar (Project Lead) — 2026-08-28 |
| **Config Version** | `v1-baseline` |

---

### Entry: `RISK-v1.0.0`

| Field | Value |
|---|---|
| **Version Tag** | `RISK-v1.0.0` |
| **Date** | `2026-08-28` |
| **Component** | `ml/risk/risk_engine.py` — rule-based CVD risk scoring |
| **Change Summary** | Initial baseline. Score-based rule engine: AVR<0.65 (+2), tortuosity>1.2 (+2), density<0.05 (+1), DR≥2 (+3), DR=1 (+1), BP>140 (+2), blood_sugar>140 (+2), cholesterol>200 (+1), age>60 (+1), diabetes_history (+2). Bands: ≤2 LOW, 3–6 MODERATE, ≥7 HIGH. All thresholds externalized to `ml/config/pipeline_v1_baseline.yaml`. Note: hypertension boolean field is stored but not yet consumed. |
| **Rationale** | Baseline establishment. |
| **Validation Dataset** | `UK-Biobank-MACE-outcomes` designated for future calibration (gated — access application pending per `build.md §7.3`). |
| **Benchmark Result** | Calibration, Brier score, and NRI/IDI vs. PCE/QRISK3 not yet recorded. Required before any future promotion of a risk-engine candidate. |
| **Sign-off** | Sahil Powar (Project Lead) — 2026-08-28 |
| **Config Version** | `v1-baseline` |

---

## Adding Future Entries

Copy the template below for every future change-controlled promotion:

```markdown
### Entry: `MODULE-vX.Y.Z`

| Field | Value |
|---|---|
| **Version Tag** | `MODULE-vX.Y.Z` |
| **Date** | `YYYY-MM-DD` |
| **Component** | `path/to/changed/file` |
| **Change Summary** | What changed and in which files |
| **Rationale** | Why the change was made |
| **Validation Dataset** | Named held-out set + version tag |
| **Benchmark Result** | KEY-METRIC: BEFORE_VALUE → AFTER_VALUE |
| **Sign-off** | Full Name (Role) — YYYY-MM-DD |
| **Config Version** | `v1-baseline` or later tag |
```
