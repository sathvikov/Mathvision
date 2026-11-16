# MathVision — Handwritten Mathematical Expression Recognition & Solver

> **Deep Learning & Computer Vision System** | End-to-end local CNN inference & symbolic algebraic solver.

MathVision is an end-to-end intelligent system that recognizes handwritten mathematical equations from interactive canvas drawings or uploaded images, reconstructs the expressions using spatial symbol segmentation, and solves them locally using symbolic computation.

---

## 🌟 Key Features

- **Interactive Drawing Canvas**: Multi-touch HTML5 canvas with stroke-width options (Fine, Medium, Thick), responsive coordinate scaling, and multi-level Undo support.
- **Quick-Try Presets**: 1-click test gallery containing real handwritten equations (`2x + 5 = 15`, `3x - 7 = 11`, `7x = 35`, `4x + 2 = 18`, `12 + 8 = 20`, `20 ÷ 4 = 5`).
- **Offline Custom CNN Classifier**: Lightweight ~2.9 MB model trained on HASYv2 and CROHME datasets achieving 96.5% test accuracy across 16 mathematical symbol classes (`0–9`, `+`, `−`, `×`, `÷`, `=`, `x`).
- **Step-by-Step Symbolic Solver**: Powered by SymPy — generates verified algebraic derivations for linear equations and checks arithmetic validity without arbitrary `eval()`.
- **Live Recognition Inspection**: Displays bounding contours, segmented symbol crops, and individual classification confidence percentages.
- **Dual Interfaces**:
  - Modern **Next.js 16 + Tailwind CSS** web application (prepared for Vercel).
  - Standalone **Streamlit** dashboard for rapid desktop experimentation (`python run.py`).

---

## 🏗 System Architecture

```
User Input (Canvas / Image)
            ↓
Image Preprocessing (Grayscale, Adaptive Thresholding, Noise Removal via OpenCV)
            ↓
Spatial Symbol Segmentation (Contour Detection, Scale Normalization to 28×28)
            ↓
Custom CNN Inference (TensorFlow / Keras 3-layer Convolutional Classifier)
            ↓
Visual Expression Reconstruction (Left-to-Right Ordering & Operator Mapping)
            ↓
Symbolic Mathematical Solver (SymPy Equation Parser & Step Generator)
            ↓
JSON API Response → Visual UI with Step-by-Step Proof
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Set Up the Python Virtual Environment & Backend
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the test suite (all 24 tests)
pytest -v

# Start the FastAPI backend server (port 8000)
uvicorn backend.api:app --reload --port 8000
```

### 2. Set Up and Run the Next.js Frontend
```bash
# In a new terminal tab:
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Alternative: Run the Streamlit Dashboard
```bash
python run.py
```
Open **[http://localhost:8501](http://localhost:8501)**.

---

## 🌐 Cloud Deployment

### 1. Deploy Frontend to Vercel
1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), import your repository.
3. Configure settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
4. Add the Environment Variable:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend (e.g. `https://your-mathvision-api.onrender.com/api`).
5. Click **Deploy**.

### 2. Deploy Backend API to Render (or Railway / Fly.io)
Because the backend includes TensorFlow (~250MB), deploy it as a Web Service on Render:
1. Create a new **Web Service** in Render and connect your GitHub repository.
2. Configure settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.api:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/health`
3. Add Environment Variable:
   - `CORS_ALLOW_ORIGINS`: Comma-separated list of your frontend URLs (e.g., `https://your-app.vercel.app,http://localhost:3000`).

*(Alternatively, Render Blueprint `render.yaml` is pre-configured in this repository).*

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and model availability |
| `GET` | `/api/model-info` | CNN model architecture, vocabulary, and test metrics |
| `POST` | `/api/solve` | Multipart image upload for segmentation, recognition, and solving |

### Example `/api/solve` Response:
```json
{
  "equation": "2x+5=15",
  "solution": "x = 5",
  "confidence": 0.997,
  "inference_time_ms": 370,
  "symbols": [
    {"symbol": "2", "confidence": 1.0},
    {"symbol": "x", "confidence": 0.98},
    {"symbol": "+", "confidence": 1.0},
    {"symbol": "5", "confidence": 1.0},
    {"symbol": "=", "confidence": 1.0},
    {"symbol": "1", "confidence": 1.0},
    {"symbol": "5", "confidence": 1.0}
  ],
  "steps": [
    {
      "operation": "Subtract 5 from both sides",
      "before": "2x + 5 = 15",
      "after": "2x = 10"
    },
    {
      "operation": "Divide both sides by 2",
      "before": "2x = 10",
      "after": "x = 5"
    }
  ]
}
```

---

## 🧪 Testing

The test suite covers model loading, contour segmentation, scale invariance, symbol prediction, step generation, and edge cases:
```bash
pytest -v
```
All **24 tests** execute and verify deterministically without external network calls.
