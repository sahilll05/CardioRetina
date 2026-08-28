# CardioRetina AI — Clinician Agreement & Explainability Study Protocol

> **Standard**: DECIDE-AI / build.md §13.5  
> **Target**: Quantify clinician agreement with model attribution overlays (A/V visualization & vessel glow)

---

## 1. Objective

To measure whether board-certified ophthalmologists and cardiologists agree with the model's visual attribution overlays (artery/vein classification, vessel tortuosity, and regional risk attribution).

## 2. Study Design

- **Blinded Panel Review**: A panel of 3 clinical experts reviews 100 randomly sampled fundus images.
- **Visual Artifacts**: Experts inspect the color-coded A/V overlay (`MaskSplitSlider`) and vessel glow overlay (`VesselGlowOverlay`) blinded to the model's numerical risk score.
- **Rating Scale**: 5-point Likert scale (1 = Highly Unplausible, 5 = Highly Plausible / Clinically Accurate).

## 3. Primary Endpoint

- **Inter-Rater Agreement**: Fleiss' Kappa ($\kappa$) across clinician ratings.
- **Attribution Plausibility Metric**: Percentage of cases rated $\ge 4$ (Plausible or Highly Plausible).
- Target benchmark: $\ge 85\%$ clinician agreement prior to publication.
