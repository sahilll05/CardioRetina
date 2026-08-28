"""
Dataset Loaders & Data Augmentation Module — CardioRetina AI
Supports EyePACS, APTOS 2019, DDR, IDRiD, Messidor-2 for DR grading,
and DRIVE, STARE, CHASE_DB1, HRF, Fundus-AVSeg for vessel & A/V segmentation.
"""
import os
import cv2
import numpy as np
from typing import Tuple, Dict, Any, List, Optional
import torch
from torch.utils.data import Dataset, DataLoader

class FundusDRDataset(Dataset):
    """
    PyTorch Dataset for Diabetic Retinopathy Grading.
    Performs standard preprocessing (CLAHE contrast enhancement, resize, normalization).
    """

    def __init__(self, image_paths: List[str], labels: List[int], image_size: Tuple[int, int] = (300, 300), is_training: bool = True):
        self.image_paths = image_paths
        self.labels = labels
        self.image_size = image_size
        self.is_training = is_training

    def __len__(self):
        return len(self.image_paths)

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        # Resize image
        resized = cv2.resize(image, self.image_size)
        # Convert BGR to RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        # Apply CLAHE on Green Channel for improved vessel/lesion contrast
        lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
        # Normalize to [0, 1]
        normalized = enhanced.astype(np.float32) / 255.0
        return normalized

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        path = self.image_paths[idx]
        image = cv2.imread(path)
        if image is None:
            # Fallback zero array if corrupt image
            image = np.zeros((*self.image_size, 3), dtype=np.uint8)

        processed = self._preprocess(image)

        # Basic Augmentations if training
        if self.is_training:
            if np.random.rand() > 0.5:
                processed = np.fliplr(processed).copy()
            if np.random.rand() > 0.5:
                processed = np.flipud(processed).copy()

        # Convert HWC to CHW tensor
        tensor = torch.from_numpy(processed).permute(2, 0, 1).float()
        label = self.labels[idx]
        return tensor, label


class FundusAVDataset(Dataset):
    """
    PyTorch Dataset for 3-class Artery/Vein Segmentation (Background, Artery, Vein).
    Primary fine-tuning set: Fundus-AVSeg (2025).
    """

    def __init__(self, image_paths: List[str], mask_paths: List[str], image_size: Tuple[int, int] = (512, 512)):
        self.image_paths = image_paths
        self.mask_paths = mask_paths
        self.image_size = image_size

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        img_path = self.image_paths[idx]
        mask_path = self.mask_paths[idx]

        img = cv2.imread(img_path)
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

        if img is None:
            img = np.zeros((*self.image_size, 3), dtype=np.uint8)
        else:
            img = cv2.resize(img, self.image_size)

        if mask is None:
            mask = np.zeros(self.image_size, dtype=np.uint8)
        else:
            mask = cv2.resize(mask, self.image_size, interpolation=cv2.INTER_NEAREST)

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        img_tensor = torch.from_numpy(img_rgb).permute(2, 0, 1).float()
        mask_tensor = torch.from_numpy(mask).long()

        return img_tensor, mask_tensor
