class RiskEngine:
    """Calculate cardiovascular risk based on biomarkers and clinical data"""
    
    @staticmethod
    def calculate_risk(biomarkers, disease_result, clinical_data):
        """
        Calculate risk score and level
        
        Args:
            biomarkers: dict with av_ratio, density, tortuosity, branching_angle
            disease_result: dict with dr_grade, dr_probability
            clinical_data: dict with age, BP, sugar, etc.
        
        Returns:
            dict with risk_level, confidence, reasons
        """
        risk_score = 0
        reasons = []
        
        # Biomarker-based risk
        if biomarkers.get("av_ratio", 1.0) < 0.65:
            risk_score += 2
            reasons.append("Low A/V ratio detected (narrowed arteries)")
        
        if biomarkers.get("tortuosity", 1.0) > 1.2:
            risk_score += 2
            reasons.append("High vessel tortuosity (abnormal vessel curvature)")
        
        if biomarkers.get("vessel_density", 0) < 0.05:
            risk_score += 1
            reasons.append("Low vessel density")
        
        # Disease-based risk
        dr_grade = disease_result.get("dr_grade", 0)
        if dr_grade >= 2:
            risk_score += 3
            reasons.append(f"Diabetic retinopathy detected (Grade {dr_grade})")
        elif dr_grade == 1:
            risk_score += 1
            reasons.append("Mild diabetic retinopathy signs")
        
        # Clinical data-based risk
        bp_systolic = clinical_data.get("bp_systolic", 0)
        if bp_systolic and bp_systolic > 140:
            risk_score += 2
            reasons.append(f"High blood pressure ({bp_systolic} mmHg)")
        
        blood_sugar = clinical_data.get("blood_sugar", 0)
        if blood_sugar and blood_sugar > 140:
            risk_score += 2
            reasons.append(f"Elevated blood sugar ({blood_sugar} mg/dL)")
        
        cholesterol = clinical_data.get("cholesterol", 0)
        if cholesterol and cholesterol > 200:
            risk_score += 1
            reasons.append(f"High cholesterol ({cholesterol} mg/dL)")
        
        age = clinical_data.get("age", 0)
        if age and age > 60:
            risk_score += 1
            reasons.append(f"Age-related risk (age {age})")
        
        if clinical_data.get("diabetes_history", False):
            risk_score += 2
            reasons.append("History of diabetes")
        
        # Determine risk level
        if risk_score <= 2:
            risk_level = "LOW"
            confidence = 0.85
        elif risk_score <= 6:
            risk_level = "MODERATE"
            confidence = 0.80
        else:
            risk_level = "HIGH"
            confidence = 0.90
        
        # Add general advice
        if not reasons:
            reasons.append("No significant risk factors detected")
        
        return {
            "risk_level": risk_level,
            "confidence": confidence,
            "risk_score": risk_score,
            "reasons": reasons
        }