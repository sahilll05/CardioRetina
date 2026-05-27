import numpy as np

class AVFusion:
    """Fuse AV predictions with vessel mask"""
    
    @staticmethod
    def fuse_masks(av_output, vessel_mask):
        """
        Fuse AV classification with vessel segmentation
        
        Args:
            av_output: (3, H, W) - class probabilities for background, artery, vein
            vessel_mask: (H, W) - binary vessel mask
        
        Returns:
            artery_mask, vein_mask
        """
        # Get class predictions
        class_map = np.argmax(av_output, axis=0)  # (H, W)
        
        # Extract artery and vein masks
        artery_mask = (class_map == 1).astype(np.uint8)
        vein_mask = (class_map == 2).astype(np.uint8)
        
        # Fuse with vessel mask (AND operation)
        artery_mask = np.logical_and(artery_mask, vessel_mask).astype(np.uint8)
        vein_mask = np.logical_and(vein_mask, vessel_mask).astype(np.uint8)
        
        return artery_mask, vein_mask, class_map