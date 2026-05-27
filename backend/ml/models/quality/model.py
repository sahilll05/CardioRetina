import torch
import torch.nn as nn
from torchvision import models

class QualityModel(nn.Module):
    def __init__(self, num_classes=2):
        super(QualityModel, self).__init__()
        # Using MobileNetV3 Small as per pretrained weights
        self.backbone = models.mobilenet_v3_small(pretrained=False)
        in_features = self.backbone.classifier[0].in_features  # 576
        
        # Match the custom checkpoint trained architecture
        self.backbone.classifier[0] = nn.Linear(in_features, 128)
        self.backbone.classifier[3] = nn.Linear(128, num_classes)
        
    def forward(self, x):
        return self.backbone(x)