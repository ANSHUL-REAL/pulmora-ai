# Pulmora AI

Pulmora AI is an educational chest X-ray analysis platform that combines a Next.js frontend, a FastAPI inference API, and a trained PyTorch model to deliver real image classification with Grad-CAM explainability.

It is designed as a portfolio-ready AI product demo: users can upload a chest X-ray, run model inference, review prediction confidence, and inspect a heatmap that highlights the regions influencing the model's output.

## Live links

- Live demo: [https://pulmora-ai.vercel.app/](https://pulmora-ai.vercel.app/)
- Backend API: [https://pulmora-ai-1.onrender.com/](https://pulmora-ai-1.onrender.com/)
- Health check: [https://pulmora-ai-1.onrender.com/health](https://pulmora-ai-1.onrender.com/health)
- GitHub repository: [https://github.com/ANSHUL-REAL/pulmora-ai](https://github.com/ANSHUL-REAL/pulmora-ai)

## Highlights

- Real trained PyTorch model for `Normal` vs `Pneumonia` chest X-ray classification
- Grad-CAM heatmap generation for visual explainability
- Interactive frontend built with Next.js
- FastAPI backend with live inference and metrics endpoints
- Deployed full-stack demo using Vercel and Render

## Disclaimer

Pulmora AI is intended for educational and portfolio use only. It is not a medical device and must not be used for clinical diagnosis or treatment decisions.

## Structure

- `frontend/` - Next.js App Router frontend
- `backend/` - FastAPI inference and metrics API
- `model/` - model metadata and checkpoint location
- `docs/` - PRD and SRS

## Local run

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if the backend is not running on `http://127.0.0.1:8000`.

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set `MODEL_CHECKPOINT_PATH` to your `.pt` or `.pth` file before using real inference.

## Notes

- The backend keeps uploads in memory only.
- Metrics are loaded from `model/metrics.sample.json` by default.
- The app is for educational use only and does not provide clinical diagnosis.

## Train a real model

Place a dataset in this structure:

```text
dataset-root/
  train/
    NORMAL/
    PNEUMONIA/
  val/
    NORMAL/
    PNEUMONIA/
```

If `val/` is missing, the training script creates a deterministic validation split from `train/`.

Run training from the repo root:

```powershell
python model\train_model.py --dataset-root D:\path\to\dataset-root --epochs 8
```

This writes:

- `model/checkpoint.pth`
- `model/metrics.generated.json`

Once those files exist, the backend can serve real predictions and real metrics instead of sample metadata.

## Deploy online with the trained model

This repo is set up for a portfolio-friendly split deployment:

- `frontend/` on Vercel
- `backend/` on Render
- `model/checkpoint.pth` committed in the repo so the live backend can load the trained model

### GitHub push

From the repo root:

```powershell
git init
git add .
git commit -m "Pulmora AI initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pulmora-ai.git
git push -u origin main
```

### Backend on Render

Create a Render Web Service from the repo root with:

- Root Directory: leave empty
- Build Command:

```bash
pip install -r backend/requirements.txt
```

- Start Command:

```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set these environment variables in Render:

```text
MODEL_CHECKPOINT_PATH=/opt/render/project/src/model/checkpoint.pth
ALLOW_ORIGINS=https://YOUR-FRONTEND.vercel.app
```

If you also want preview deployments later, add them as a comma-separated list in `ALLOW_ORIGINS`.

### Frontend on Vercel

Import the same repo into Vercel with:

- Framework: Next.js
- Root Directory: `frontend`

Set this environment variable in Vercel:

```text
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.onrender.com
```

### Deployment order

1. Push the repo to GitHub
2. Deploy the backend on Render
3. Copy the Render backend URL
4. Add that URL to the Vercel `NEXT_PUBLIC_API_URL` variable
5. Deploy the frontend on Vercel
6. Copy the Vercel frontend URL
7. Add that URL to Render `ALLOW_ORIGINS`
8. Redeploy the backend

### What to expect

- Good fit for a portfolio project, demo, and recruiter walkthrough
- Real trained model inference when `model/checkpoint.pth` is present
- Cold starts and slow first requests are normal on free Render tiers
- Educational only: not a clinical or production medical system
