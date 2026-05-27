import numpy as np
import cv2
import torch

class VesselPostprocessor:
    def __init__(self, threshold=0.5):
        self.threshold = threshold
    
    def postprocess(self, output, original_size):
        """
        Postprocess vessel segmentation output
        
        Args:
            output: model output tensor
            original_size: (height, width) of original image
        
        Returns:
            probability_mask: float array [0, 1]
            binary_mask: binary array {0, 1}
        """
        # Remove batch dimension and convert to numpy
        if isinstance(output, torch.Tensor):
            output = output.squeeze().cpu().numpy()
        
        # Apply sigmoid
        probability_mask = 1 / (1 + np.exp(-output))
        
        # Apply threshold
        binary_mask = (probability_mask > self.threshold).astype(np.uint8)
        
        # Resize to original size
        probability_mask = cv2.resize(probability_mask, (original_size[1], original_size[0]))
        binary_mask = cv2.resize(binary_mask, (original_size[1], original_size[0]))
        binary_mask = (binary_mask > 0.5).astype(np.uint8)
        
        return probability_mask, binary_mask