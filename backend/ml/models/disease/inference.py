import torch
import torch.nn.functional as F
from ml.models.disease.model import DiseaseModel
from ml.models.disease.preprocess import DiseasePreprocessor
from app.config import settings
import os

class DiseaseInference:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = DiseaseModel(num_classes=5)
        
        # Load weights robustly (handle relative path issues)
        model_path = os.path.join(settings.MODEL_WEIGHTS_PATH, "disease_screen.pth")
        if not os.path.exists(model_path):
            # Fallback to absolute path relative to this file
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            model_path = os.path.join(base_dir, "weights", "disease_screen.pth")

        if os.path.exists(model_path):
            # Load state dict and remap keys
            state_dict = torch.load(model_path, map_location=self.device, weights_only=False)
            new_state_dict = {}
            for k, v in state_dict.items():
                if not k.startswith("backbone."):
                    new_state_dict[f"backbone.{k}"] = v
                else:
                    new_state_dict[k] = v
            
            self.model.load_state_dict(new_state_dict, strict=False)
            print(f"[OK] Disease model loaded weights from {model_path}")
        else:
            print(f"[WARNING] Could not find weights at {model_path}. Initializing with random weights for training.")

        self.model.to(self.device)
        self.model.eval()
        
        self.preprocessor = DiseasePreprocessor()
        
        print(f"[OK] Disease model loaded on {self.device}")
    
    def predict(self, image_path):
        """
        Predict DR grade
        Returns: dict with dr_grade, dr_probability, class_probabilities
        """
        with torch.no_grad():
            # Preprocess
            img_tensor = self.preprocessor.preprocess(image_path)
            img_tensor = img_tensor.to(self.device)
            
            # Predict
            outputs = self.model(img_tensor)
            probabilities = F.softmax(outputs, dim=1)
            
            # Get predictions
            class_probs = probabilities[0].cpu().numpy().tolist()
            dr_grade = int(probabilities.argmax().item())
            dr_probability = float(probabilities[0][dr_grade].item())
            
            return {
                "dr_grade": dr_grade,
                "dr_probability": dr_probability,
                "class_probabilities": class_probs
            }