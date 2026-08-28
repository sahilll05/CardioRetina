# TRIPOD+AI Reporting Checklist (BMJ 2024)

| Item No. | Section / Topic | Description | Status / Location |
|---|---|---|---|
| 1 | Title | Identify as a prediction model study incorporating AI | ✅ CardioRetina AI Title |
| 2 | Abstract | Structured summary of objectives, design, sample size, metrics | ✅ Section 1 |
| 3a | Background | Explain medical context & clinical decision support posture | ✅ build.md §1 |
| 3b | Objectives | Specific research questions & target population | ✅ build.md §13 |
| 4a | Source of data | Describe study design and data collection dates | ✅ build.md §11 |
| 4b | Participants | Eligibility criteria & setting | ✅ research/protocol |
| 5a | Outcome | Definition of outcomes (DR grade, 5-year MACE) | ✅ build.md §7.3 |
| 6a | Predictors | Definition of imaging & clinical predictors | ✅ build.md §5.10 |
| 7a | Sample size | Rationale for sample size & number of events | ✅ build.md §11.2 |
| 10a | Statistical methods | AUC, calibration, Brier score, NRI, IDI | ✅ build.md §13.3 |
| 10b | Missing data | Handling of missing clinical factors | ✅ ml/risk/risk_engine.py |
| 13a | Participants | Participant flow & baseline characteristics | ✅ research/protocol |
| 14a | Performance | Discrimination and calibration results with 95% CIs | ✅ compliance/pccp/ |
| 16 | Fairness | Subgroup-stratified performance across demographic strata | ✅ build.md §13.4 |
| 17 | Limitations | Key limitations & domain shift risks | ✅ research/model_card.md |
| 19 | Funding & Roles | Disclosures and data availability | ✅ research/data_availability.md |
