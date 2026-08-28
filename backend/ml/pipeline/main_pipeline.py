import os
import cv2
import numpy as np
from datetime import datetime
from ml.features.biomarkers import BiomarkerExtractor
from ml.risk.risk_engine import RiskEngine
from app.config import settings

class MainPipeline:
    """Main AI pipeline orchestrator"""
    
    def __init__(self, quality_model, vessel_model, av_model, disease_model, config=None):
        self.quality_model = quality_model
        self.vessel_model = vessel_model
        self.av_model = av_model
        self.disease_model = disease_model
        self.config = config
        self.biomarker_extractor = BiomarkerExtractor()
        self.risk_engine = RiskEngine()

    def run(self, image_path, clinical_data):
        """
        Run complete pipeline
        
        Returns: dict with all results or error
        """
        results = {
            "status": "processing",
            "started_at": datetime.utcnow().isoformat()
        }
        
        try:
            # STEP 1: Quality Check
            print("[INFO] Step 1: Quality Check")
            quality_result = self.quality_model.predict(image_path)
            results["quality"] = quality_result
            
            if not quality_result["is_gradable"]:
                results["status"] = "failed"
                results["error"] = "Image not gradable - please retake"
                return results
            
            # STEP 2: Vessel Segmentation
            print("[INFO] Step 2: Vessel Segmentation")
            vessel_result = self.vessel_model.predict(image_path)
            vessel_mask = vessel_result["binary_mask"]
            results["vessel_segmentation"] = {
                "vessel_pixels": int(np.sum(vessel_mask > 0))
            }
            
            # STEP 3: A/V Classification
            print("[INFO] Step 3: A/V Classification")
            av_result = self.av_model.predict(image_path, vessel_mask)
            artery_mask = av_result["artery_mask"]
            vein_mask = av_result["vein_mask"]
            results["av_classification"] = {
                "artery_pixels": int(np.sum(artery_mask > 0)),
                "vein_pixels": int(np.sum(vein_mask > 0))
            }
            
            # STEP 4: Biomarker Extraction
            print("[INFO] Step 4: Biomarker Extraction")
            biomarkers = self.biomarker_extractor.extract_all(
                vessel_mask, artery_mask, vein_mask
            )
            results["biomarkers"] = biomarkers
            
            # STEP 5: Disease Screening
            print("[INFO] Step 5: Disease Screening")
            disease_result = self.disease_model.predict(image_path)
            results["disease"] = disease_result
            
            # STEP 6: Risk Assessment
            print("[INFO] Step 6: Risk Assessment")
            risk_result = self.risk_engine.calculate_risk(
                biomarkers, disease_result, clinical_data, config=self.config
            )
            results["risk"] = risk_result
            
            # STEP 7: Save Masks
            print("[INFO] Step 7: Saving Masks")
            mask_paths = self._save_masks(
                image_path, vessel_mask, artery_mask, vein_mask
            )
            results["mask_paths"] = mask_paths
            
            results["status"] = "completed"
            results["completed_at"] = datetime.utcnow().isoformat()
            
            print("[OK] Pipeline completed successfully")
            return results
            
        except Exception as e:
            print(f"[ERROR] Pipeline failed: {str(e)}")
            results["status"] = "failed"
            results["error"] = str(e)
            return results
    
    def _save_masks(self, image_path, vessel_mask, artery_mask, vein_mask):
        """Save masks as images"""
        base_name = os.path.splitext(os.path.basename(image_path))[0]
        
        vessel_path = os.path.join(settings.UPLOAD_DIR, f"{base_name}_vessel.png")
        artery_path = os.path.join(settings.UPLOAD_DIR, f"{base_name}_artery.png")
        vein_path = os.path.join(settings.UPLOAD_DIR, f"{base_name}_vein.png")
        
        cv2.imwrite(vessel_path, vessel_mask * 255)
        cv2.imwrite(artery_path, artery_mask * 255)
        cv2.imwrite(vein_path, vein_mask * 255)
        
        return {
            "vessel_mask": vessel_path,
            "artery_mask": artery_path,
            "vein_mask": vein_path
        }