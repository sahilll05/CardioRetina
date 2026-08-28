"""
PyTorch A/V Segmentation Model Fine-Tuning Script — CardioRetina AI
Model: U-Net++ 3-Channel Segmentation (Background, Artery, Vein)
Primary Dataset: LES-AV / DRIVE-AV / HRF-AV
Hardware: NVIDIA GeForce RTX 4060 GPU with Automatic Mixed Precision (AMP)
"""
import os
import sys
import yaml
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.cuda.amp import autocast, GradScaler

# Ensure backend & root path in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from ml.models.av.model import AVModel
from training.datasets.dataset_loader import FundusAVDataset


def discover_av_datasets(datasets_root: Path):
    """Scan training/datasets for available A/V segmentation datasets."""
    image_paths = []
    mask_paths = []

    # Check for rmaphohLearning-AVSegmentation folder
    av_dir = datasets_root / "rmaphohLearning-AVSegmentation"
    search_dirs = [av_dir] if av_dir.exists() else [datasets_root]

    for root_search in search_dirs:
        for sub in root_search.rglob("training"):
            img_dir = sub / "images"
            # Support both 1st_manual and mask folder names
            mask_dir = sub / "1st_manual" if (sub / "1st_manual").exists() else (sub / "mask" if (sub / "mask").exists() else None)

            if img_dir.exists() and mask_dir and mask_dir.exists():
                for img_file in img_dir.glob("*.*"):
                    if img_file.suffix.lower() in [".png", ".jpg", ".jpeg", ".tif", ".tiff"]:
                        # Find matching mask file by stem
                        matching_masks = list(mask_dir.glob(f"{img_file.stem}.*"))
                        if matching_masks:
                            image_paths.append(str(img_file))
                            mask_paths.append(str(matching_masks[0]))

    return image_paths, mask_paths


def run_av_training(epochs: int = 5, batch_size: int = 4, config_path: str = None):
    print("==========================================================")
    print("  CardioRetina AI — A/V Segmentation Fine-Tuning (CUDA)   ")
    print("==========================================================")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[HARDWARE] Active Device: {device}")
    if torch.cuda.is_available():
        print(f"[HARDWARE] GPU Name: {torch.cuda.get_device_name(0)}")

    datasets_root = BASE_DIR / "training" / "datasets"
    img_paths, mask_paths = discover_av_datasets(datasets_root)

    if not img_paths:
        print(f"[ERROR] No image/mask pairs found in {datasets_root}")
        return None

    print(f"[DATASET] Discovered {len(img_paths)} training pairs.")

    dataset = FundusAVDataset(image_paths=img_paths, mask_paths=mask_paths, image_size=(512, 512))
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)

    model = AVModel(in_channels=3, out_channels=3).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
    criterion = nn.CrossEntropyLoss()
    use_cuda = torch.cuda.is_available()
    scaler = torch.amp.GradScaler('cuda', enabled=use_cuda)

    save_dir = BACKEND_DIR / "ml" / "weights"
    save_dir.mkdir(parents=True, exist_ok=True)
    weights_path = save_dir / "av_classify.pth"

    print(f"[TRAINING] Starting training for {epochs} epochs on {len(dataset)} samples...")

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0

        for step, (images, masks) in enumerate(loader, 1):
            images = images.to(device)
            # Clamp mask classes to valid index range [0, 2] (0: bg, 1: artery, 2: vein)
            masks = torch.clamp(masks, 0, 2).to(device)

            optimizer.zero_grad()

            with torch.amp.autocast('cuda', enabled=use_cuda):
                outputs = model(images)  # Shape: (B, 3, H, W)
                loss = criterion(outputs, masks)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            running_loss += loss.item()

        epoch_loss = running_loss / len(loader)
        print(f"  Epoch [{epoch}/{epochs}] — Loss: {epoch_loss:.4f}")

    torch.save(model.state_dict(), weights_path)
    print(f"[SUCCESS] Trained model saved to: {weights_path}")
    return model


if __name__ == "__main__":
    run_av_training(epochs=5, batch_size=2)

