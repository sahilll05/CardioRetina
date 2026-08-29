import torch
import cv2
import numpy as np
from ml.models.vessel.model import UNetPlusPlus
from ml.models.vessel.postprocess import VesselPostprocessor
from app.config import settings
import os

class VesselInference:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = UNetPlusPlus(in_channels=3, out_channels=1)
        
        # Load weights
        model_path = os.path.join(settings.MODEL_WEIGHTS_PATH, "vessel_seg.pth")
        self.model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=False))
        self.model.to(self.device)
        self.model.eval()
        
        self.postprocessor = VesselPostprocessor()
        self.image_size = 512
        
        print(f"[OK] Vessel model loaded on {self.device}")
    
    def preprocess(self, image_path):
        """Preprocess for vessel model - BGR format, /255 normalization"""
        img = cv2.imread(image_path)
        original_size = img.shape[:2]
        
        # Resize to 512x512
        img_resized = cv2.resize(img, (self.image_size, self.image_size))
        
        # Normalize to [0, 1]
        img_normalized = img_resized.astype(np.float32) / 255.0
        
        # Convert to tensor (H, W, C) -> (C, H, W)
        img_tensor = torch.from_numpy(img_normalized).permute(2, 0, 1)
        img_tensor = img_tensor.unsqueeze(0)  # Add batch dimension
        
        return img_tensor, original_size
    
    def predict(self, image_path):
        """
        Predict vessel segmentation
        Returns: dict with probability_mask and binary_mask
        """
        with torch.no_grad():
            # Preprocess
            img_tensor, original_size = self.preprocess(image_path)
            img_tensor = img_tensor.to(self.device)
            
            # Predict
            output = self.model(img_tensor)
            
            # Postprocess
            probability_mask, binary_mask = self.postprocessor.postprocess(
                output, original_size
            )
            
            return {
                "probability_mask": probability_mask,
                "binary_mask": binary_mask
            }