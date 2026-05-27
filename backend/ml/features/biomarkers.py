import numpy as np
import cv2
from scipy import ndimage
from skimage.morphology import skeletonize

class BiomarkerExtractor:
    """Extract cardiovascular biomarkers from vessel masks"""
    
    @staticmethod
    def calculate_av_ratio(artery_mask, vein_mask):
        """Calculate Artery-Vein Ratio"""
        # Skeletonize masks
        artery_skeleton = skeletonize(artery_mask > 0)
        vein_skeleton = skeletonize(vein_mask > 0)
        
        # Calculate average vessel width using distance transform
        artery_dist = ndimage.distance_transform_edt(artery_mask)
        vein_dist = ndimage.distance_transform_edt(vein_mask)
        
        # Average diameter (multiply by 2)
        artery_width = np.mean(artery_dist[artery_skeleton]) * 2 if artery_skeleton.any() else 0
        vein_width = np.mean(vein_dist[vein_skeleton]) * 2 if vein_skeleton.any() else 0
        
        # Calculate ratio
        if vein_width > 0:
            av_ratio = artery_width / vein_width
        else:
            av_ratio = 0.0
        
        return float(av_ratio)
    
    @staticmethod
    def calculate_vessel_density(vessel_mask):
        """Calculate vessel density"""
        total_pixels = vessel_mask.size
        vessel_pixels = np.sum(vessel_mask > 0)
        density = vessel_pixels / total_pixels
        return float(density)
    
    @staticmethod
    def calculate_tortuosity(vessel_mask):
        """Calculate vessel tortuosity"""
        # Skeletonize
        skeleton = skeletonize(vessel_mask > 0)
        
        # Find contours
        contours, _ = cv2.findContours(
            skeleton.astype(np.uint8), 
            cv2.RETR_LIST, 
            cv2.CHAIN_APPROX_NONE
        )
        
        if not contours:
            return 0.0
        
        tortuosities = []
        for contour in contours:
            if len(contour) < 10:  # Skip very small segments
                continue
            
            # Arc length (actual path)
            arc_length = cv2.arcLength(contour, False)
            
            # Chord length (straight line distance)
            if len(contour) >= 2:
                start = contour[0][0]
                end = contour[-1][0]
                chord_length = np.sqrt((end[0] - start[0])**2 + (end[1] - start[1])**2)
                
                if chord_length > 0:
                    tortuosity = arc_length / chord_length
                    tortuosities.append(tortuosity)
        
        # Return average tortuosity
        return float(np.mean(tortuosities)) if tortuosities else 1.0
    
    @staticmethod
    def calculate_branching_angle(vessel_mask):
        """Calculate average branching angle"""
        # Skeletonize
        skeleton = skeletonize(vessel_mask > 0).astype(np.uint8)
        
        # Find branch points (pixels with >2 neighbors)
        kernel = np.ones((3, 3), np.uint8)
        neighbors = cv2.filter2D(skeleton, -1, kernel) * skeleton
        branch_points = np.where(neighbors > 3)
        
        if len(branch_points[0]) == 0:
            return 90.0  # Default angle
        
        angles = []
        for y, x in zip(branch_points[0], branch_points[1]):
            # Get local region
            region = skeleton[max(0, y-10):min(skeleton.shape[0], y+10),
                             max(0, x-10):min(skeleton.shape[1], x+10)]
            
            # Find lines using HoughLines
            lines = cv2.HoughLines(region, 1, np.pi/180, threshold=5)
            
            if lines is not None and len(lines) >= 2:
                # Calculate angle between first two lines
                angle1 = lines[0][0][1]
                angle2 = lines[1][0][1]
                angle_diff = abs(np.degrees(angle1 - angle2))
                angles.append(min(angle_diff, 180 - angle_diff))
        
        return float(np.mean(angles)) if angles else 90.0
    
    @staticmethod
    def extract_all(vessel_mask, artery_mask, vein_mask):
        """Extract all biomarkers"""
        return {
            "av_ratio": BiomarkerExtractor.calculate_av_ratio(artery_mask, vein_mask),
            "vessel_density": BiomarkerExtractor.calculate_vessel_density(vessel_mask),
            "tortuosity": BiomarkerExtractor.calculate_tortuosity(vessel_mask),
            "branching_angle": BiomarkerExtractor.calculate_branching_angle(vessel_mask)
        }