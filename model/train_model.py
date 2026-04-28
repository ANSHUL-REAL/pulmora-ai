from __future__ import annotations

import argparse
import json
import random
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch import nn
from torch.optim import Adam
from torch.utils.data import DataLoader, Dataset, Subset, random_split

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.services.resnet import resnet18


LABEL_TO_INDEX = {"NORMAL": 0, "PNEUMONIA": 1}
INDEX_TO_LABEL = ["Normal", "Pneumonia"]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def normalize_image(image: Image.Image) -> torch.Tensor:
    resized = image.resize((224, 224))
    array = np.asarray(resized.convert("RGB")).astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    normalized = (array - mean) / std
    return torch.from_numpy(normalized.transpose(2, 0, 1))


class ChestXrayDataset(Dataset[tuple[torch.Tensor, int]]):
    def __init__(self, root: Path) -> None:
        self.samples: list[tuple[Path, int]] = []
        for label_name, label_idx in LABEL_TO_INDEX.items():
            label_dir = root / label_name
            if not label_dir.exists():
                continue
            for image_path in sorted(label_dir.rglob("*")):
                if image_path.suffix.lower() in IMAGE_EXTENSIONS:
                    self.samples.append((image_path, label_idx))

        if not self.samples:
            raise FileNotFoundError(
                f"No X-ray images found under {root}. Expected NORMAL/ and PNEUMONIA/ folders."
            )

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int]:
        image_path, label = self.samples[index]
        image = Image.open(image_path).convert("RGB")
        return normalize_image(image), label


@dataclass
class EpochMetrics:
    loss: float
    accuracy: float


def run_epoch(
    model: nn.Module,
    loader: DataLoader[tuple[torch.Tensor, int]],
    criterion: nn.Module,
    device: torch.device,
    optimizer: Adam | None = None,
) -> EpochMetrics:
    is_training = optimizer is not None
    model.train(is_training)

    total_loss = 0.0
    total_correct = 0
    total_samples = 0

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)

        if optimizer is not None:
            optimizer.zero_grad(set_to_none=True)

        logits = model(images)
        loss = criterion(logits, labels)

        if optimizer is not None:
            loss.backward()
            optimizer.step()

        predictions = torch.argmax(logits, dim=1)
        total_loss += float(loss.item()) * labels.size(0)
        total_correct += int((predictions == labels).sum().item())
        total_samples += labels.size(0)

    return EpochMetrics(
        loss=total_loss / max(total_samples, 1),
        accuracy=total_correct / max(total_samples, 1),
    )


def evaluate_confusion_matrix(
    model: nn.Module,
    loader: DataLoader[tuple[torch.Tensor, int]],
    device: torch.device,
) -> list[list[int]]:
    model.eval()
    confusion = [[0, 0], [0, 0]]

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)
            predictions = torch.argmax(model(images), dim=1)

            for true_label, predicted_label in zip(labels.tolist(), predictions.tolist()):
                confusion[true_label][predicted_label] += 1

    return confusion


def compute_precision_recall(confusion: list[list[int]]) -> tuple[float, float]:
    tp = confusion[1][1]
    fp = confusion[0][1]
    fn = confusion[1][0]
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    return precision, recall


def maybe_make_validation_split(
    train_dataset: ChestXrayDataset,
    seed: int,
) -> tuple[Subset[tuple[torch.Tensor, int]], Subset[tuple[torch.Tensor, int]]]:
    val_size = max(1, int(len(train_dataset) * 0.2))
    train_size = len(train_dataset) - val_size
    generator = torch.Generator().manual_seed(seed)
    train_subset, val_subset = random_split(
        train_dataset,
        [train_size, val_size],
        generator=generator,
    )
    return train_subset, val_subset


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Pulmora AI chest X-ray model.")
    parser.add_argument(
        "--dataset-root",
        type=Path,
        required=True,
        help="Dataset root containing train/ and optionally val/ folders with NORMAL and PNEUMONIA subfolders.",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=8,
        help="Number of training epochs.",
    )
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--checkpoint-out",
        type=Path,
        default=Path("model/checkpoint.pth"),
    )
    parser.add_argument(
        "--metrics-out",
        type=Path,
        default=Path("model/metrics.generated.json"),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    set_seed(args.seed)

    dataset_root = args.dataset_root.resolve()
    train_dir = dataset_root / "train"
    val_dir = dataset_root / "val"

    if not train_dir.exists():
        raise FileNotFoundError(f"Missing required training directory: {train_dir}")

    train_dataset = ChestXrayDataset(train_dir)
    if val_dir.exists():
        train_subset: Dataset[tuple[torch.Tensor, int]] = train_dataset
        val_subset: Dataset[tuple[torch.Tensor, int]] = ChestXrayDataset(val_dir)
    else:
        train_subset, val_subset = maybe_make_validation_split(train_dataset, args.seed)

    train_loader = DataLoader(train_subset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_subset, batch_size=args.batch_size, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = resnet18(num_classes=len(INDEX_TO_LABEL)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = Adam(model.parameters(), lr=args.learning_rate)

    history = {
        "epochs": [],
        "train_loss": [],
        "val_loss": [],
        "train_accuracy": [],
        "val_accuracy": [],
    }

    best_accuracy = -1.0
    best_state: dict[str, torch.Tensor] | None = None

    for epoch in range(1, args.epochs + 1):
        train_metrics = run_epoch(model, train_loader, criterion, device, optimizer)
        val_metrics = run_epoch(model, val_loader, criterion, device)

        history["epochs"].append(epoch)
        history["train_loss"].append(round(train_metrics.loss, 4))
        history["val_loss"].append(round(val_metrics.loss, 4))
        history["train_accuracy"].append(round(train_metrics.accuracy, 4))
        history["val_accuracy"].append(round(val_metrics.accuracy, 4))

        if val_metrics.accuracy > best_accuracy:
            best_accuracy = val_metrics.accuracy
            best_state = {
                key: value.detach().cpu().clone()
                for key, value in model.state_dict().items()
            }

        print(
            f"Epoch {epoch}/{args.epochs} | "
            f"train_loss={train_metrics.loss:.4f} train_acc={train_metrics.accuracy:.4f} | "
            f"val_loss={val_metrics.loss:.4f} val_acc={val_metrics.accuracy:.4f}"
        )

    if best_state is None:
        raise RuntimeError("Training did not produce a checkpoint state.")

    model.load_state_dict(best_state)
    confusion = evaluate_confusion_matrix(model, val_loader, device)
    precision, recall = compute_precision_recall(confusion)

    args.checkpoint_out.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": best_state, "labels": INDEX_TO_LABEL}, args.checkpoint_out)

    metrics_payload = {
        "accuracy": round(best_accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "confusion_matrix": confusion,
        "training_curves": history,
    }

    args.metrics_out.parent.mkdir(parents=True, exist_ok=True)
    args.metrics_out.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")

    print(f"Saved checkpoint to {args.checkpoint_out}")
    print(f"Saved metrics to {args.metrics_out}")


if __name__ == "__main__":
    main()
