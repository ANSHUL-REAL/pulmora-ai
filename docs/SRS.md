# Pulmora AI SRS

## Introduction

Pulmora AI is an AI-based chest X-ray analysis system for educational and research-oriented use.

## Functional Requirements

- `FR1`: allow X-ray image upload
- `FR2`: accept JPG and PNG only
- `FR3`: return class label and confidence score
- `FR4`: generate Grad-CAM heatmap
- `FR5`: display image, prediction, confidence, and heatmap
- `FR6`: display performance metrics
- `FR7`: handle invalid input and server errors

## Non-Functional Requirements

- Response time target within 3 seconds
- Responsive and clean UI
- No permanent storage of uploaded images
- Input validation for uploaded files
- Ability to handle multiple requests within free-tier constraints

## API

### `POST /predict`

Input: image file upload

Output:

```json
{
  "prediction": "Pneumonia",
  "confidence": 0.87,
  "heatmap_url": "..."
}
```

## Assumptions

- Model checkpoint is pre-trained and provided externally
- Uploaded files are chest X-ray images
- Metrics are supplied from precomputed evaluation artifacts
