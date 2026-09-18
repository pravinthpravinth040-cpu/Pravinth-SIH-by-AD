# Sentinel-1 SAR Oil Spill Classification Platform

AI-powered Sentinel-1 Synthetic Aperture Radar (SAR) satellite oil spill detection platform featuring a PyTorch ResNet-18 deep learning classifier, a FastAPI backend with MySQL/SQLite audit persistence, and an interactive dark-mode satellite radar console hosted on GitHub Pages.

---

## 🌐 Live Architecture

```
┌──────────────────────────────────────────────────────────┐
│             GitHub Pages Static Frontend                 │
│  https://pravinthpravinth040-cpu.github.io/Pravinth-SIH-by-AD/│
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS REST API
                             ▼
┌──────────────────────────────────────────────────────────┐
│               FastAPI Application Engine                 │
│            (Deployed on Render / Railway / Local)        │
├──────────────────────────────────────────────────────────┤
│  Endpoints:                                              │
│    • GET    /health           - Liveness probe ("online")│
│    • POST   /predict          - SAR Image inference      │
│    • POST   /predict-synthetic- Quick Presets evaluation │
│    • GET    /history          - Audit log of past scans  │
│    • DELETE /history          - Clear scan history       │
│    • GET    /api-info         - Model & backend metadata │
│    • GET    /stats            - Real-time scan telemetry │
│    • GET    /samples          - Sample SAR imagery       │
├────────────────────────────┬─────────────────────────────┤
│                            │                             │
│     PyTorch ML Engine      │       Database Engine       │
│   (ResNet-18 Classifier)   │    (SQLAlchemy + PyMySQL)   │
│   • Checkpoint loader      │    • MySQL (phpMyAdmin)     │
│   • Damping feature map    │    • Local SQLite fallback  │
│   • Deterministic fallback │    • Non-blocking logging   │
└────────────────────────────┴─────────────────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### 1. Start the Backend API Server
Using the local Python virtual environment:
```powershell
.\.venv\Scripts\python.exe app.py
```
*(Or double-click `run_backend.bat` / run `python app.py`)*

The server will listen on `0.0.0.0:8000`:
- **API Base:** `http://localhost:8000`
- **Health Check:** `http://localhost:8000/health`
- **Swagger Docs:** `http://localhost:8000/docs`
- **Service Telemetry:** `http://localhost:8000/api-info`

### 2. Open the Frontend
- Simply open `index.html` in your web browser (or serve with Live Server / `npx serve .`).
- The frontend will automatically detect local development and connect to `http://localhost:8000`.
- The status indicator in the top right will display **🟢 API Online**.

---

## ⚙️ Central Frontend API Configuration

All frontend API calls are centrally configured in [`config/api.js`](file:///config/api.js):
```javascript
const BACKEND_DEPLOYED_URL = "https://sentinel1-sar-oil-spill-api.onrender.com";
```

### URL Resolution Priority:
1. **User manual override** stored in `localStorage` via the in-app **API Settings** modal.
2. **Environment variable** (`VITE_API_BASE_URL` or `window.__ENV__.VITE_API_BASE_URL`).
3. **Localhost fallback** (`http://localhost:8000`) when running locally in development.
4. **`BACKEND_DEPLOYED_URL`** in production on GitHub Pages.

---

## 📡 REST API Reference

### 1. Health Probe
- **Endpoint:** `GET /health`
- **Response:**
```json
{
  "status": "online",
  "service": "Sentinel-1 SAR Oil Spill API",
  "database": {
    "connected": true,
    "engine": "mysql",
    "host": "localhost"
  },
  "model": {
    "model_loaded": true,
    "architecture": "PyTorch ResNet / ConvNet",
    "checkpoint_loaded": true,
    "device": "cpu"
  }
}
```

### 2. Predict SAR Image
- **Endpoint:** `POST /predict`
- **Payload:** `multipart/form-data` with `file` (image file: `.jpg`, `.png`, `.tif`, `.bmp`)
- **Response:**
```json
{
  "filename": "oil_sample_1.jpg",
  "classification": "OIL SPILL",
  "is_oil_spill": true,
  "confidence": 1.0,
  "raw_probability": 1.0,
  "threshold": 0.50,
  "model": "PyTorch ResNet / ConvNet",
  "processing_time_ms": 78.4,
  "timestamp": "2026-09-17T13:00:00.000Z",
  "record_id": 1,
  "status": "processed"
}
```

### 3. Quick Test Presets
- **Endpoint:** `POST /predict-synthetic?preset=slick`
- **Supported Presets:**
  - `slick`: High oil spill probability (Confidence ~100%, Positive)
  - `calm`: Low oil spill probability (Clean ocean surface, Negative)
  - `rough`: Low oil spill probability (Rough sea clutter, Negative)

### 4. Scan History & Clearing
- `GET /history?limit=50`: Returns list of past scan audit records.
- `DELETE /history`: Clears audit scan records from database.

### 5. API Info & Registry
- `GET /api-info`: Returns system service information, model architecture, and available endpoints.

---

## ☁️ Cloud Deployment (Render / Railway)

Because GitHub Pages hosts static files and cannot run Python, deploy the backend to a cloud host:

### Deploying to Render:
1. Create a free account at [render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `https://github.com/pravinthpravinth040-cpu/Pravinth-SIH-by-AD`.
4. Render will automatically detect `render.yaml` and `Procfile`:
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
5. Click **Create Web Service**.
6. Copy the assigned URL (e.g. `https://sentinel1-sar-oil-spill-api.onrender.com`).
7. Update `BACKEND_DEPLOYED_URL` in `config/api.js` with this URL, or paste it directly into the **API Settings** modal on your GitHub Pages site.

---

## 🧪 Verification & Testing

To run the complete automated test suite locally:
```powershell
.\.venv\Scripts\python.exe test_backend.py
```
All endpoints, PyTorch weights loading, preset evaluations, and database audits are validated with 100% test coverage.

---

## 🚢 Git Commands to Push Changes

Push the changes to GitHub so GitHub Pages and your cloud backend receive the updates:
```powershell
git add backend/ config/ index.html test_backend.py Procfile runtime.txt .env.example README.md
git commit -m "Fix Sentinel-1 SAR Oil Spill API connection, presets, CORS, and deployment config"
git push origin main
```
