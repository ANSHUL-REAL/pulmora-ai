from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
GENERATED_METRICS_PATH = BASE_DIR / "model" / "metrics.generated.json"
SAMPLE_METRICS_PATH = BASE_DIR / "model" / "metrics.sample.json"


@dataclass(frozen=True)
class Settings:
    checkpoint_path: Path = Path(
        os.getenv("MODEL_CHECKPOINT_PATH", BASE_DIR / "model" / "checkpoint.pth")
    )
    metrics_path: Path = Path(
        os.getenv(
            "MODEL_METRICS_PATH",
            GENERATED_METRICS_PATH if GENERATED_METRICS_PATH.exists() else SAMPLE_METRICS_PATH,
        )
    )
    target_layer: str = os.getenv("MODEL_TARGET_LAYER", "layer4.1.conv2")
    allow_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "ALLOW_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
        ).split(",")
        if origin.strip()
    )


settings = Settings()
