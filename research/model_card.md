# CardioRetina AI — Clinical Model Card

> **Version**: v1.0.0 (Baseline)  
> **Date**: 2026-08-28  
> **Model Architectures**: MobileNetV3-Small (Quality), U-Net++ (Vessel/AV), EfficientNet-B3 (DR), Rule Engine / ML Candidate (Risk)

---

## 1. Intended Use
CardioRetina AI is intended for clinician-facing decision support to assist in diabetic retinopathy screening and non-invasive cardiovascular risk stratification from retinal fundus photographs. It is **not** an autonomous diagnostic device.

## 2. Model Pipeline Architecture
1. **Quality Checker**: MobileNetV3-Small (gradable vs. ungradable threshold: 0.5).
2. **Vessel Segmentor**: U-Net++ binary vessel mask.
3. **A/V Classifier**: U-Net++ 3-class artery/vein classification + mask fusion.
4. **Biomarker Extractor**: AVR, vessel density, tortuosity, branching angle calculation.
5. **DR Classifier**: EfficientNet-B3 5-grade DR prediction (0–4).
6. **CVD Risk Engine**: Configurable rule engine / shadow ML candidate.

## 3. Training & Benchmark Datasets
- **Quality**: DDR / EyePACS split
- **Vessel & A/V**: DRIVE, STARE, CHASE_DB1, HRF, Fundus-AVSeg (2025)
- **DR Grading**: EyePACS, APTOS 2019, DDR, IDRiD, Messidor-2
- **CVD Risk**: UK Biobank outcome-linked cohort (gated) / surrogate risk datasets

## 4. Known Limitations & Caveats
- Reduced accuracy on ungradable / severely cataract-obscured fundus images.
- CVD risk output must be interpreted alongside standard clinical parameters (blood pressure, blood glucose).
