import torch
import torch.nn as nn
from torchvision import models

class DiseaseModel(nn.Module):
    def __init__(self, num_classes=5):
        super(DiseaseModel, self).__init__()
        # Using EfficientNet-B3
        self.backbone = models.efficientnet_b3(pretrained=False)
        in_features = self.backbone.classifier[1].in_features
        # Replace classifier with the detailed multi-layer seq from weights
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(256, num_classes)
        )
        
    def forward(self, x):
        return self.backbone(x)