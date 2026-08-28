"""
PyTorch DR Grading Model Fine-Tuning Script — CardioRetina AI
Model: EfficientNet-B3 / DiseaseClassifier
Target: 5-class Diabetic Retinopathy Grading (0: No DR, 1: Mild, 2: Moderate, 3: Severe, 4: Proliferative)
Hardware: NVIDIA GeForce RTX 4060 GPU with Automatic Mixed Precision (AMP)
"""
import os
import sys
import csv
import yaml
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

# Ensure backend & root path in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from ml.models.disease.inference import DiseaseInference
from training.datasets.dataset_loader import FundusDRDataset


def discover_dr_dataset(datasets_root: Path):
    """Scan training/datasets for DR grading dataset (CSV or folder-based)."""
    image_paths = []
    labels = []

    # 1. Search for CSV files (e.g. train.csv, trainLabels.csv)
    for csv_file in datasets_root.rglob("*.csv"):
        img_dir = csv_file.parent / "train_images" if (csv_file.parent / "train_images").exists() else csv_file.parent
        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) >= 2:
                    id_code, diagnosis = row[0], row[1]
                    try:
                        diag_val = int(diagnosis)
                        # Check image extensions
                        for ext in [".png", ".jpg", ".jpeg", ".tif"]:
                            candidate = img_dir / f"{id_code}{ext}"
                            if candidate.exists():
                                image_paths.append(str(candidate))
                                labels.append(diag_val)
                                break
                    except ValueError:
                        continue
        if image_paths:
            print(f"[DATASET] Found CSV-based dataset at {csv_file} with {len(image_paths)} samples.")
            return image_paths, labels

    # 2. Search for class folder structure (0/, 1/, 2/, 3/, 4/)
    for class_id in range(5):
        class_folder_name = str(class_id)
        for class_dir in datasets_root.rglob(class_folder_name):
            if class_dir.is_dir():
                for img_file in class_dir.glob("*.*"):
                    if img_file.suffix.lower() in [".png", ".jpg", ".jpeg"]:
                        image_paths.append(str(img_file))
                        labels.append(class_id)

    if image_paths:
        print(f"[DATASET] Found folder-structured dataset with {len(image_paths)} samples.")
        return image_paths, labels

    return image_paths, labels


def run_dr_training(epochs: int = 5, batch_size: int = 8, config_path: str = None):
    print("==========================================================")
    print("   CardioRetina AI — DR Grading Model Training (CUDA)    ")
    print("==========================================================")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[HARDWARE] Active Device: {device}")
    if torch.cuda.is_available():
        print(f"[HARDWARE] GPU Name: {torch.cuda.get_device_name(0)}")

    datasets_root = BASE_DIR / "training" / "datasets"
    img_paths, labels = discover_dr_dataset(datasets_root)

    if not img_paths:
        print(f"[WARNING] No DR dataset found in {datasets_root}. Waiting for dataset download...")
        print("[INFO] Once downloaded, place the dataset into 'training/datasets/' and re-run this script.")
        return None

    print(f"[DATASET] Loaded {len(img_paths)} total samples for training.")

    dataset = FundusDRDataset(image_paths=img_paths, labels=labels, image_size=(300, 300), is_training=True)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)

    disease_inf = DiseaseInference()
    model = disease_inf.model.to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    use_cuda = torch.cuda.is_available()
    scaler = torch.amp.GradScaler("cuda", enabled=use_cuda)

    save_dir = BACKEND_DIR / "ml" / "weights"
    save_dir.mkdir(parents=True, exist_ok=True)
    weights_path = save_dir / "disease_screen.pth"

    print(f"[TRAINING] Starting DR grading fine-tuning for {epochs} epochs...", flush=True)

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        total_steps = len(loader)

        for step, (images, target_labels) in enumerate(loader, 1):
            images = images.to(device)
            target_labels = target_labels.to(device)

            optimizer.zero_grad()

            with torch.amp.autocast("cuda", enabled=use_cuda):
                outputs = model(images)
                loss = criterion(outputs, target_labels)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == target_labels).item()
            total += target_labels.size(0)
            
            # Print live progress every 10 batches so we know it's not frozen
            if step % 10 == 0 or step == total_steps:
                print(f"    Epoch {epoch}/{epochs} | Batch {step}/{total_steps} | Batch Loss: {loss.item():.4f}", flush=True)

        epoch_loss = running_loss / max(total, 1)
        epoch_acc = (correct / max(total, 1)) * 100.0
        print(f"  --> Epoch [{epoch}/{epochs}] COMPLETED | Average Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.2f}%", flush=True)

    torch.save(model.state_dict(), weights_path)
    print(f"[SUCCESS] DR Grading model saved to: {weights_path}", flush=True)
    return model


if __name__ == "__main__":
    run_dr_training(epochs=5, batch_size=16)

