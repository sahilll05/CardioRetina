# CardioRetina AI — Preregistered Validation Protocol & Statistical Analysis Plan

> **Protocol ID**: CR-SAP-2026-V1  
> **Registration Target**: OSF / ClinicalTrials.gov  
> **Standard**: TRIPOD+AI / PROBAST+AI (BMJ 2024/2025)

---

## 1. Study Design & Positioning

CardioRetina AI is a multi-disease oculomics clinical decision-support (CDS) system evaluating diabetic retinopathy (DR) grade and cardiovascular disease (CVD) risk stratification from a single retinal fundus image. This protocol prespecifies the statistical analysis plan for external validation **before** data unblinding.

## 2. Baselines & Primary Hypotheses

- **Primary Baseline**: Pooled Cohort Equations (PCE) / QRISK3 standard cardiovascular risk score.
- **Hypothesis 1 (Incremental Value)**: Retinal vessel biomarkers (AVR, tortuosity, density) fused with clinical data yield a statistically significant Net Reclassification Improvement (NRI > 0, $p < 0.01$) and Integrated Discrimination Improvement (IDI > 0, $p < 0.01$) over standard clinical risk scores alone for 5-year MACE prediction.
- **Hypothesis 2 (DR Accuracy)**: DR grading achieves sensitivity $\ge 95\%$ and specificity $\ge 85\%$ for referable DR (Grade $\ge 2$) across external validation cohorts.

## 3. Data Integrity & Patient Provenance

- **Patient-Level Separation**: Train, validation, and held-out test splits are partitioned strictly at the **patient level** (never image-level) to prevent data leakage.
- **External Cohorts**: Evaluated on an independent hospital population with different camera hardware (Topcon, Canon) not seen during model fine-tuning.

## 4. Statistical Methods

- **Discrimination**: Receiver Operating Characteristic (ROC) AUC with 95% DeLong confidence intervals.
- **Calibration**: Calibration intercept and slope, Brier score, and loess calibration curves.
- **Reclassification**: Categorical NRI ($<10\%$, $10–20\%$, $>20\%$ 5-year risk tiers) and continuous NRI.
