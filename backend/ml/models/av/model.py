import torch
import torch.nn as nn
from ml.models.vessel.model import UNetPlusPlus

class AVModel(UNetPlusPlus):
    """U-Net++ for A/V classification - 3 classes (background, artery, vein)"""
    def __init__(self, in_channels=3, out_channels=3):
        super(AVModel, self).__init__(in_channels, out_channels)