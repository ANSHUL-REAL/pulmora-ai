# Pulmora AI PRD

## Objective

Pulmora AI is a web-based application that uses deep learning to analyze chest X-ray images and predict potential lung conditions such as pneumonia, along with visual explanations to improve transparency.

## Target Users

- Students and developers
- AI and ML learners
- Researchers for basic experimentation

## Non-Goals

- Not intended for clinical or real-world medical diagnosis
- Does not replace professional radiologists

## Core Features

1. Image upload for chest X-ray JPG and PNG files
2. AI prediction for `Normal` or `Pneumonia`
3. Confidence score output
4. Grad-CAM heatmap overlay
5. Results dashboard with original image, prediction, confidence, and heatmap toggle
6. Model insights including accuracy, precision, recall, confusion matrix, and training curves
7. Educational disclaimer

## Success Metrics

- Accuracy target at or above 85%
- Response time target within 3 seconds
- Smooth user experience
- Deployable frontend and backend

## Stack

- Frontend: Next.js
- Backend: FastAPI
- ML: PyTorch with ResNet
- Deployment: Vercel plus Render or Hugging Face
