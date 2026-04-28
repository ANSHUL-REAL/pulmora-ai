from __future__ import annotations

from email import policy
from email.parser import BytesParser

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import MetricsResponse, PredictionResponse
from app.services.inference import inference_service
from app.services.metadata import load_metrics


MAX_FILE_SIZE = 5 * 1024 * 1024


app = FastAPI(
    title="Pulmora AI Backend",
    description="Educational chest X-ray inference with Grad-CAM explainability.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allow_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/metrics", response_model=MetricsResponse)
def metrics() -> MetricsResponse:
    try:
        return load_metrics()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


async def _extract_uploaded_image(request: Request) -> tuple[bytes, str]:
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type:
        raise HTTPException(status_code=400, detail="Expected multipart form upload.")

    body = await request.body()
    if len(body) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB).")

    message = BytesParser(policy=policy.default).parsebytes(
        (
            f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode(
                "utf-8"
            )
            + body
        )
    )

    if not message.is_multipart():
        raise HTTPException(status_code=400, detail="Malformed multipart payload.")

    for part in message.iter_parts():
        disposition = part.get_content_disposition()
        if disposition != "form-data":
            continue

        filename = part.get_filename()
        if not filename:
            continue

        media_type = part.get_content_type()
        payload = part.get_payload(decode=True) or b""
        if len(payload) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large (max 5MB).")
        return payload, media_type

    raise HTTPException(status_code=400, detail="No uploaded image was found.")


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: Request) -> PredictionResponse:
    contents, media_type = await _extract_uploaded_image(request)

    if media_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=400, detail="Only JPG and PNG files are supported.")

    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = inference_service.predict(contents)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {exc}",
        ) from exc

    return PredictionResponse(
        prediction=result.prediction,
        confidence=result.confidence,
        heatmap_base64=result.heatmap_base64,
    )
