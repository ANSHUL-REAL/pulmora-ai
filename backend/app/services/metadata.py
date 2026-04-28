from __future__ import annotations

import json
from pathlib import Path

from app.config import settings
from app.schemas import MetricsResponse


def load_metrics(path: Path | None = None) -> MetricsResponse:
    metrics_path = path or settings.metrics_path
    with metrics_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return MetricsResponse.model_validate(payload)
