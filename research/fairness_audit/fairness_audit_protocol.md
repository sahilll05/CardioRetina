# CardioRetina AI — Prespecified Fairness & Demographic Bias Audit Protocol

> **Standard**: Health-Equity MLOps / build.md §13.4  
> **Infrastructure Substrate**: `backend/app/services/model_monitoring.py`

---

## 1. Rationale & Hazard Identification

Published literature demonstrates that demographic signal (sex, racial identity, skin tone proxy) leaks into retinal vessel segmentations and color fundus images. Failure to audit across demographic strata introduces the hazard of performance disparity (e.g., lower sensitivity in underrepresented patient populations).

## 2. Prespecified Strata & Subgroup Metrics

Performance (Sensitivity, Specificity, Calibration Slope, Brier Score) is evaluated and reported across:
1. **Sex**: Male vs. Female.
2. **Age Brackets**: $<45$, $45–60$, $>60$ years.
3. **Hypertension / Diabetes Status**: Diagnostic sub-cohorts.
4. **Camera Hardware**: Topcon vs. Canon vs. Portable Fundus Scanners.

## 3. Disparity Thresholds & Trigger Rules

- **Equalized Odds Threshold**: Disparity in True Positive Rate (Sensitivity) across any major demographic subgroup must not exceed $5.0\%$.
- **Calibration Shift Threshold**: Brier score ratio between subgroups must remain $< 1.25$.
- Any breach automatically logs a warning in `compliance/pccp/model_changelog.md` and triggers a recalibration review before promotion.
