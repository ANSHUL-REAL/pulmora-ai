from __future__ import annotations

from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float = Field(ge=0.0, le=1.0)
    heatmap_url: str | None = None
    heatmap_base64: str | None = None


class TrainingCurves(BaseModel):
    epochs: list[int]
    train_loss: list[float]
    val_loss: list[float]
    train_accuracy: list[float]
    val_accuracy: list[float]


class MetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    confusion_matrix: list[list[int]]
    training_curves: TrainingCurves
