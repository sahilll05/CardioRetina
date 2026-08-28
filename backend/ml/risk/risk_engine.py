class RiskEngine:
    """Calculate cardiovascular risk based on biomarkers, clinical data, and versioned config parameters"""
    
    @staticmethod
    def calculate_risk(biomarkers, disease_result, clinical_data, config=None):
        """
        Calculate risk score and level using configurable thresholds & weights.
        
        Args:
            biomarkers: dict with av_ratio, density, tortuosity, branching_angle
            disease_result: dict with dr_grade, dr_probability
            clinical_data: dict with age, BP, sugar, etc.
            config: optional dict loaded from ml/config/ pipeline YAML
        
        Returns:
            dict with risk_level, confidence, risk_score, reasons
        """
        risk_cfg = (config or {}).get("risk", {})
        weights = risk_cfg.get("factor_weights", {
            "avr_low": 2,
            "tortuosity_high": 2,
            "vessel_density_low": 1,
            "dr_grade_2plus": 3,
            "dr_grade_1": 1,
            "bp_systolic_high": 2,
            "blood_sugar_high": 2,
            "cholesterol_high": 1,
            "age_high": 1,
            "diabetes_history": 2,
            "hypertension_flag": 0,
        })
        thresholds = risk_cfg.get("thresholds", {
            "avr_threshold": 0.65,
            "tortuosity_threshold": 1.2,
            "vessel_density_threshold": 0.05,
            "bp_systolic_threshold": 140,
            "blood_sugar_threshold": 140,
            "cholesterol_threshold": 200,
            "age_threshold": 60,
        })
        bands = risk_cfg.get("band_thresholds", {
            "low_max": 2,
            "moderate_max": 6,
        })
        conf_vals = risk_cfg.get("confidence_values", {
            "LOW": 0.85,
            "MODERATE": 0.80,
            "HIGH": 0.90,
        })

        risk_score = 0
        reasons = []
        
        # Biomarker-based risk
        if biomarkers.get("av_ratio", 1.0) < thresholds["avr_threshold"]:
            risk_score += weights.get("avr_low", 2)
            reasons.append("Low A/V ratio detected (narrowed arteries)")
        
        if biomarkers.get("tortuosity", 1.0) > thresholds["tortuosity_threshold"]:
            risk_score += weights.get("tortuosity_high", 2)
            reasons.append("High vessel tortuosity (abnormal vessel curvature)")
        
        if biomarkers.get("vessel_density", 0) < thresholds["vessel_density_threshold"]:
            risk_score += weights.get("vessel_density_low", 1)
            reasons.append("Low vessel density")
        
        # Disease-based risk
        dr_grade = disease_result.get("dr_grade", 0)
        if dr_grade >= 2:
            risk_score += weights.get("dr_grade_2plus", 3)
            reasons.append(f"Diabetic retinopathy detected (Grade {dr_grade})")
        elif dr_grade == 1:
            risk_score += weights.get("dr_grade_1", 1)
            reasons.append("Mild diabetic retinopathy signs")
        
        # Clinical data-based risk
        bp_systolic = clinical_data.get("bp_systolic", 0)
        if bp_systolic and bp_systolic > thresholds["bp_systolic_threshold"]:
            risk_score += weights.get("bp_systolic_high", 2)
            reasons.append(f"High blood pressure ({bp_systolic} mmHg)")
        
        blood_sugar = clinical_data.get("blood_sugar", 0)
        if blood_sugar and blood_sugar > thresholds["blood_sugar_threshold"]:
            risk_score += weights.get("blood_sugar_high", 2)
            reasons.append(f"Elevated blood sugar ({blood_sugar} mg/dL)")
        
        cholesterol = clinical_data.get("cholesterol", 0)
        if cholesterol and cholesterol > thresholds["cholesterol_threshold"]:
            risk_score += weights.get("cholesterol_high", 1)
            reasons.append(f"High cholesterol ({cholesterol} mg/dL)")
        
        age = clinical_data.get("age", 0)
        if age and age > thresholds["age_threshold"]:
            risk_score += weights.get("age_high", 1)
            reasons.append(f"Age-related risk (age {age})")
        
        if clinical_data.get("diabetes_history", False):
            risk_score += weights.get("diabetes_history", 2)
            reasons.append("History of diabetes")
        
        if clinical_data.get("hypertension", False) and weights.get("hypertension_flag", 0) > 0:
            risk_score += weights.get("hypertension_flag", 0)
            reasons.append("History of hypertension")

        # Determine risk level based on band thresholds
        if risk_score <= bands.get("low_max", 2):
            risk_level = "LOW"
            confidence = conf_vals.get("LOW", 0.85)
        elif risk_score <= bands.get("moderate_max", 6):
            risk_level = "MODERATE"
            confidence = conf_vals.get("MODERATE", 0.80)
        else:
            risk_level = "HIGH"
            confidence = conf_vals.get("HIGH", 0.90)
        
        if not reasons:
            reasons.append("No significant risk factors detected")
        
        return {
            "risk_level": risk_level,
            "confidence": confidence,
            "risk_score": risk_score,
            "reasons": reasons
        }