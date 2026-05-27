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
        
        # Load weights
        model_path = os.path.join(settings.MODEL_WEIGHTS_PATH, "disease_screen.pth")
        
        # Load state dict and remap keys
        state_dict = torch.load(model_path, map_location=self.device)
        new_state_dict = {}
        for k, v in state_dict.items():
            if not k.startswith("backbone."):
                new_state_dict[f"backbone.{k}"] = v
            else:
                new_state_dict[k] = v
        
        self.model.load_state_dict(new_state_dict, strict=False)
        self.model.to(self.device)
        self.model.eval()
        
        self.preprocessor = DiseasePreprocessor()
        
        print(f"✅ Disease model loaded on {self.device}")
    
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