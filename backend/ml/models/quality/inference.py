import torch
import torch.nn.functional as F
from ml.models.quality.model import QualityModel
from ml.models.quality.preprocess import QualityPreprocessor
from app.config import settings
import os

class QualityInference:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = QualityModel(num_classes=2)
        
        # Load weights
        model_path = os.path.join(settings.MODEL_WEIGHTS_PATH, "quality_net.pth")
        
        state_dict = torch.load(model_path, map_location=self.device, weights_only=False)
        
        # If the state_dict does not have the "backbone." prefix but the model expects it, remap the keys dynamically
        remapped_state_dict = {}
        for k, v in state_dict.items():
            if k.startswith("features.") or k.startswith("classifier."):
                remapped_state_dict[f"backbone.{k}"] = v
            else:
                remapped_state_dict[k] = v
                
        self.model.load_state_dict(remapped_state_dict, strict=False)
        self.model.to(self.device)
        self.model.eval()
        
        self.preprocessor = QualityPreprocessor()
        
        print(f"[OK] Quality model loaded on {self.device}")
    
    def predict(self, image_path):
        """
        Predict image quality
        Returns: dict with quality_score and is_gradable
        """
        with torch.no_grad():
            # Preprocess
            img_tensor = self.preprocessor.preprocess(image_path)
            img_tensor = img_tensor.to(self.device)
            
            # Predict
            outputs = self.model(img_tensor)
            probabilities = F.softmax(outputs, dim=1)
            
            # Get gradable probability (class 1)
            quality_score = probabilities[0][1].item()
            is_gradable = quality_score > 0.5
            
            return {
                "quality_score": float(quality_score),
                "is_gradable": bool(is_gradable)
            }