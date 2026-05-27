import torch
import cv2
import numpy as np
import torch.nn.functional as F
from ml.models.av.model import AVModel
from ml.models.av.fusion import AVFusion
from app.config import settings
import os

class AVInference:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = AVModel(in_channels=3, out_channels=3)
        
        # Load weights
        model_path = os.path.join(settings.MODEL_WEIGHTS_PATH, "av_classify.pth")
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        
        self.fusion = AVFusion()
        self.image_size = 512
        
        print(f"✅ A/V model loaded on {self.device}")
    
    def preprocess(self, image_path):
        """Preprocess for AV model - BGR format, /255 normalization"""
        img = cv2.imread(image_path)
        original_size = img.shape[:2]
        
        # Resize to 512x512
        img_resized = cv2.resize(img, (self.image_size, self.image_size))
        
        # Normalize to [0, 1]
        img_normalized = img_resized.astype(np.float32) / 255.0
        
        # Convert to tensor
        img_tensor = torch.from_numpy(img_normalized).permute(2, 0, 1)
        img_tensor = img_tensor.unsqueeze(0)
        
        return img_tensor, original_size
    
    def predict(self, image_path, vessel_mask):
        """
        Predict A/V classification
        
        Args:
            image_path: path to image
            vessel_mask: binary vessel mask from vessel model
        
        Returns: dict with artery_mask, vein_mask, class_map
        """
        with torch.no_grad():
            # Preprocess
            img_tensor, original_size = self.preprocess(image_path)
            img_tensor = img_tensor.to(self.device)
            
            # Predict
            output = self.model(img_tensor)
            
            # Apply softmax
            output = F.softmax(output, dim=1)
            
            # Convert to numpy
            output = output.squeeze().cpu().numpy()  # (3, H, W)
            
            # Resize vessel mask to match output
            vessel_mask_resized = cv2.resize(
                vessel_mask, 
                (self.image_size, self.image_size)
            )
            
            # Fuse masks
            artery_mask, vein_mask, class_map = self.fusion.fuse_masks(
                output, vessel_mask_resized
            )
            
            # Resize back to original size
            artery_mask = cv2.resize(artery_mask, (original_size[1], original_size[0]))
            vein_mask = cv2.resize(vein_mask, (original_size[1], original_size[0]))
            class_map = cv2.resize(class_map, (original_size[1], original_size[0]), 
                                   interpolation=cv2.INTER_NEAREST)
            
            # Binarize after resize
            artery_mask = (artery_mask > 0.5).astype(np.uint8)
            vein_mask = (vein_mask > 0.5).astype(np.uint8)
            
            return {
                "artery_mask": artery_mask,
                "vein_mask": vein_mask,
                "class_map": class_map
            }