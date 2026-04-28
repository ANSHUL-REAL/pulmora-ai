from __future__ import annotations

import base64
import io
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from app.config import settings
from app.services.resnet import resnet18


LABELS = ["Normal", "Pneumonia"]


@dataclass
class PredictionResult:
    prediction: str
    confidence: float
    heatmap_base64: str


class InferenceService:
    def __init__(self, checkpoint_path: Path | None = None, target_layer: str | None = None):
        self.checkpoint_path = checkpoint_path or settings.checkpoint_path
        self.target_layer_name = target_layer or settings.target_layer
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model: torch.nn.Module | None = None
        self._target_layer: torch.nn.Module | None = None

    def _build_model(self) -> torch.nn.Module:
        return resnet18(num_classes=len(LABELS))

    def _load_checkpoint(self) -> None:
        if self._model is not None:
            return

        if not self.checkpoint_path.exists():
            raise FileNotFoundError(
                f"Model checkpoint not found at {self.checkpoint_path}."
            )

        model = self._build_model()
        checkpoint = torch.load(
            self.checkpoint_path,
            map_location=self.device,
            weights_only=False,
        )
        state_dict = self._extract_state_dict(checkpoint)
        model.load_state_dict(state_dict, strict=False)
        model.eval()
        model.to(self.device)
        self._model = model
        self._target_layer = self._resolve_target_layer(model, self.target_layer_name)

    def _extract_state_dict(self, checkpoint: Any) -> dict[str, torch.Tensor]:
        if isinstance(checkpoint, dict):
            for key in ("state_dict", "model_state_dict", "model"):
                if key in checkpoint and isinstance(checkpoint[key], dict):
                    return {
                        name.replace("module.", "", 1): tensor
                        for name, tensor in checkpoint[key].items()
                    }
            if all(isinstance(value, torch.Tensor) for value in checkpoint.values()):
                return {
                    name.replace("module.", "", 1): tensor
                    for name, tensor in checkpoint.items()
                }
        raise ValueError("Unsupported checkpoint format.")

    def _resolve_target_layer(
        self, model: torch.nn.Module, layer_name: str
    ) -> torch.nn.Module:
        current: torch.nn.Module = model
        for chunk in layer_name.split("."):
            current = current[int(chunk)] if chunk.isdigit() else getattr(current, chunk)
        return current

    def _prepare_image(self, image_bytes: bytes) -> tuple[Image.Image, torch.Tensor]:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        resized = image.resize((224, 224))
        array = np.asarray(resized).astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized = (array - mean) / std
        tensor = torch.from_numpy(normalized.transpose(2, 0, 1)).unsqueeze(0).to(
            self.device
        )
        tensor.requires_grad_(True)
        return image, tensor

    def _probabilities(self, logits: torch.Tensor) -> tuple[torch.Tensor, int]:
        if logits.shape[-1] == 1:
            probability = torch.sigmoid(logits)[0, 0]
            probs = torch.stack([1 - probability, probability])
            return probs, int(torch.argmax(probs).item())
        probs = F.softmax(logits, dim=1)[0]
        return probs, int(torch.argmax(probs).item())

    def predict(self, image_bytes: bytes) -> PredictionResult:
        self._load_checkpoint()
        assert self._model is not None
        assert self._target_layer is not None

        original_image, tensor = self._prepare_image(image_bytes)

        activations: list[torch.Tensor] = []
        gradients: list[torch.Tensor] = []

        def forward_hook(_module: torch.nn.Module, _inputs: tuple[torch.Tensor], output: torch.Tensor) -> None:
            activations.append(output.detach())

        def backward_hook(
            _module: torch.nn.Module,
            _grad_input: tuple[torch.Tensor, ...],
            grad_output: tuple[torch.Tensor, ...],
        ) -> None:
            gradients.append(grad_output[0].detach())

        forward_handle = self._target_layer.register_forward_hook(forward_hook)
        backward_handle = self._target_layer.register_full_backward_hook(backward_hook)

        try:
            self._model.zero_grad(set_to_none=True)
            logits = self._model(tensor)
            probabilities, predicted_index = self._probabilities(logits)
            confidence = float(probabilities[predicted_index].item())
            logits[:, predicted_index].backward()

            if not activations or not gradients:
                raise RuntimeError("Grad-CAM hooks did not capture activations.")

            heatmap = self._build_heatmap(activations[-1], gradients[-1])
            overlay = self._overlay_heatmap(original_image, heatmap)
        finally:
            forward_handle.remove()
            backward_handle.remove()

        return PredictionResult(
            prediction=LABELS[predicted_index],
            confidence=confidence,
            heatmap_base64=self._encode_image(overlay),
        )

    def _build_heatmap(self, activations: torch.Tensor, gradients: torch.Tensor) -> np.ndarray:
        pooled_gradients = gradients.mean(dim=(2, 3), keepdim=True)
        weighted = (pooled_gradients * activations).sum(dim=1).squeeze(0)
        heatmap = torch.relu(weighted)
        if torch.max(heatmap) > 0:
            heatmap /= torch.max(heatmap)
        return heatmap.cpu().numpy()

    def _overlay_heatmap(self, image: Image.Image, heatmap: np.ndarray) -> Image.Image:
        heatmap_image = Image.fromarray(np.uint8(heatmap * 255)).resize(image.size)
        heatmap_array = np.asarray(heatmap_image).astype(np.float32) / 255.0

        color_map = np.zeros((image.height, image.width, 3), dtype=np.float32)
        color_map[:, :, 0] = np.clip(heatmap_array * 1.4, 0, 1)
        color_map[:, :, 1] = np.clip(heatmap_array * 0.8, 0, 1)
        color_map[:, :, 2] = np.clip(1.0 - heatmap_array * 0.9, 0, 1)

        image_array = np.asarray(image).astype(np.float32) / 255.0
        overlay = np.clip(image_array * 0.48 + color_map * 0.52, 0, 1)
        return Image.fromarray(np.uint8(overlay * 255))

    def _encode_image(self, image: Image.Image) -> str:
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")


inference_service = InferenceService()
