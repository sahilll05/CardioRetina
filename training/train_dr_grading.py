"""
PyTorch DR Grading Model Training Script — CardioRetina AI
Model: EfficientNet-B3
Target: 5-class Diabetic Retinopathy Grading (0: No DR, 1: Mild, 2: Moderate, 3: Severe, 4: Proliferative)
Hardware: NVIDIA GeForce RTX 4060 GPU with Automatic Mixed Precision (AMP)
"""
import os
import yaml
import time
import torch
import torch.nn as nn
from torch.cuda.amp import autocast, GradScaler
from torch.utils.data import DataLoader

from ml.models.disease.inference import DiseaseInference
from training.datasets.dataset_loader import FundusDRDataset

def train_epoch(model, dataloader, criterion, optimizer, scaler, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in dataloader:
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        with autocast():
            outputs = model(images)
            loss = criterion(outputs, labels)

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == labels.data)
        total += labels.size(0)

    epoch_loss = running_loss / max(total, 1)
    epoch_acc = (correct.double() / max(total, 1)).item()
    return epoch_loss, epoch_acc


def run_training(config_path: str = "training/config/training_config.yaml"):
    print("==========================================================")
    print("   CardioRetina AI — DR Grading Model Training (CUDA)    ")
    print("==========================================================")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[HARDWARE] Active Device: {device}")
    if torch.cuda.is_available():
        print(f"[HARDWARE] GPU Name: {torch.cuda.get_device_name(0)}")
        print(f"[HARDWARE] CUDA Version: {torch.version.cuda}")

    # Load config
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)["dr_grading_training"]

    print(f"[CONFIG] Batch Size: {cfg['batch_size']}, AMP FP16: Enabled, Epochs: {cfg['epochs']}")

    # Instantiate EfficientNet-B3 model
    disease_inf = DiseaseInference()
    model = disease_inf.model.to(device)

    # Optimizer & Scaler
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg["learning_rate"], weight_decay=cfg["weight_decay"])
    criterion = nn.CrossEntropyLoss(label_smoothing=cfg.get("label_smoothing", 0.1))
    scaler = GradScaler(enabled=torch.cuda.is_available())

    print("[STATUS] Model initialized and ready for CUDA fine-tuning.")
    return model

if __name__ == "__main__":
    run_training()
