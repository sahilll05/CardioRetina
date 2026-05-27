import cv2
import numpy as np
import torch
from torchvision import transforms

class DiseasePreprocessor:
    def __init__(self, image_size=300):
        self.image_size = image_size
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def preprocess(self, image_path):
        """
        Preprocess image for disease model
        Input: image path
        Output: tensor ready for model
        """
        # Read image
        img = cv2.imread(image_path)
        
        # Convert BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize
        img = cv2.resize(img, (self.image_size, self.image_size))
        
        # Convert to tensor and normalize
        img_tensor = self.transform(img)
        
        # Add batch dimension
        img_tensor = img_tensor.unsqueeze(0)
        
        return img_tensor