"""
PyTorch A/V Segmentation Model Fine-Tuning Script — CardioRetina AI
Model: U-Net++ 3-Channel Segmentation (Background, Artery, Vein)
Primary Dataset: Fundus-AVSeg (2025 high-resolution dataset)
Hardware: NVIDIA GeForce RTX 4060 GPU with Automatic Mixed Precision (AMP)
"""
import os
import yaml
import torch
import torch.nn as nn
from torch.cuda.amp import autocast, GradScaler
from ml.models.av.inference import AVInference

def run_av_training(config_path: str = "training/config/training_config.yaml"):
    print("==========================================================")
    print("  CardioRetina AI — A/V Segmentation Fine-Tuning (CUDA)   ")
    print("==========================================================")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[HARDWARE] Active Device: {device}")
    if torch.cuda.is_available():
        print(f"[HARDWARE] GPU Name: {torch.cuda.get_device_name(0)}")

    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)["av_segmentation_training"]

    print(f"[CONFIG] Dataset: {cfg['datasets']['primary_finetune']}, Resolution: {cfg['input_size']}")

    av_inf = AVInference()
    model = av_inf.model.to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg["learning_rate"])
    criterion = nn.CrossEntropyLoss()
    scaler = GradScaler(enabled=torch.cuda.is_available())

    print("[STATUS] U-Net++ A/V Segmentation model initialized for Fundus-AVSeg fine-tuning.")
    return model

if __name__ == "__main__":
    run_av_training()
