import os
import sys
import io
import time
from datetime import datetime
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Ensure backend package can be imported directly
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from backend.config import (
    HOST,
    PORT,
    PROJECT_ROOT,
    CANDIDATE_SAMPLE_DIRS,
    ALLOWED_ORIGINS,
    API_KEY
)
from backend.inference import predict, load_inference_model, get_model_info
from backend.database import (
    init_db,
    save_prediction,
    get_recent_records,
    get_database_stats,
    clear_all_records,
    get_db_status
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database and PyTorch Model
    print("[Backend Startup] Initializing Sentinel-1 SAR Detection Service...")
    init_db()
    load_inference_model()
    print("[Backend Startup] System ready to receive inference requests.")
    yield
    # Shutdown
    print("[Backend Shutdown] Shutting down service.")

app = FastAPI(
    title="Sentinel-1 SAR Oil Spill Classifier API",
    description="High-performance binary image classification API for detecting maritime oil spills in SAR satellite imagery.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration (GitHub Pages, localhost, live server)
cors_origins = [
    "https://pravinthpravinth040-cpu.github.io",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://localhost:8080",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5500"
]
extra_cors = os.getenv("CORS_ORIGINS", "")
if extra_cors:
    for o in extra_cors.split(","):
        o_clean = o.strip()
        if o_clean and o_clean not in cors_origins:
            cors_origins.append(o_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://pravinthpravinth040-cpu\.github\.io.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Service status and API registry endpoint."""
    return {
        "status": "ok",
        "service": "sentinel-1-sar-oil-spill-api",
        "message": "Oil Spill Detection API is running. Use POST /predict to upload an image.",
        "endpoints": {
            "health": "GET /health",
            "predict": "POST /predict",
            "predict_synthetic": "POST /predict-synthetic",
            "history": "GET /history",
            "clear_history": "DELETE /history",
            "api_info": "GET /api-info",
            "stats": "GET /stats",
            "samples": "GET /samples",
            "documentation": "GET /docs"
        },
        "database": get_db_status()["status"] if "status" in get_db_status() else get_db_status()["message"],
        "model": get_model_info()
    }

@app.get("/health")
def health_check():
    """Liveness probe for Render, monitoring platforms, and frontend connectivity."""
    db_info = get_db_status()
    model_info = get_model_info()
    return {
        "status": "ok",
        "service": "sentinel-1-sar-oil-spill-api",
        "online": True,
        "database": db_info,
        "model": model_info
    }

@app.get("/api-info")
def get_api_info():
    """Returns backend, model, and endpoint metadata."""
    return {
        "service": "Sentinel-1 SAR Oil Spill API",
        "version": "1.0.0",
        "status": "online",
        "model": get_model_info(),
        "database": get_db_status(),
        "endpoints": {
            "health": "GET /health",
            "predict": "POST /predict",
            "predict_synthetic": "POST /predict-synthetic",
            "history": "GET /history",
            "clear_history": "DELETE /history",
            "api_info": "GET /api-info",
            "stats": "GET /stats",
            "samples": "GET /samples"
        }
    }

def _resolve_sample_preset_path(preset_name: str) -> Optional[Path]:
    """Finds image file on disk for quick presets."""
    name_clean = preset_name.lower().strip()
    target_files = []
    if name_clean in ("slick", "oil", "oil_1", "sample_slick"):
        target_files = ["oil_sample_1.jpg", "sample_oil_1.jpg"]
    elif name_clean in ("calm", "clean_1", "clean_calm", "sample_calm"):
        target_files = ["clean_sample_1.jpg", "sample_no_oil_1.jpg"]
    elif name_clean in ("rough", "clean_2", "clean_rough", "sample_rough"):
        target_files = ["sample_no_oil_2.jpg", "clean_sample_1.jpg"]
    else:
        target_files = ["oil_sample_1.jpg", "clean_sample_1.jpg"]

    for candidate_dir in CANDIDATE_SAMPLE_DIRS:
        if candidate_dir.exists():
            for fname in target_files:
                p = candidate_dir / fname
                if p.exists() and p.is_file():
                    return p
    return None

@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    """
    Accepts an uploaded SAR satellite image tile and returns oil spill classification.
    Automatically logs telemetry into the database (prediction_records).
    """
    start_time = time.perf_counter()

    # 1. Validate File Format
    allowed_exts = ('.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff')
    if file.filename and not any(file.filename.lower().endswith(ext) for ext in allowed_exts):
        if file.content_type and not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (.jpg, .png, .tif, etc.)")

    # 2. Read contents
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    # 3. Model Inference
    try:
        result = predict(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    processing_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
    now_iso = datetime.utcnow().isoformat() + "Z"
    filename = file.filename or "uploaded_sar_image.jpg"
    is_oil = bool(result["oil_detected"])
    classification_str = "OIL SPILL" if is_oil else "CLEAN OCEAN"

    # 4. Database Audit Persistence
    record_id = save_prediction(
        filename=filename,
        oil_detected=is_oil,
        confidence=result["confidence"],
        raw_score=result["raw_score"],
        file_size_bytes=result.get("file_size_bytes"),
        image_sha256=result.get("image_sha256")
    )

    # 5. Build standardized response matching project requirements
    return JSONResponse(content={
        "prediction": "OIL SPILL" if is_oil else "CLEAN",
        "confidence": round(float(result["confidence"]), 4),
        "raw_probability": round(float(result["raw_score"]), 4),
        "processing_time_ms": processing_time_ms,
        "model": result.get("model", "oil-spill-classifier"),
        "classification": classification_str,
        "filename": filename,
        "is_oil_spill": is_oil,
        "oil_detected": is_oil,
        "raw_score": round(float(result["raw_score"]), 4),
        "threshold": 0.50,
        "timestamp": now_iso,
        "record_id": record_id,
        "status": "ok"
    })

@app.post("/predict-synthetic")
async def predict_synthetic_endpoint(
    preset: Optional[str] = Query(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Supports the Sample Slick, Sample Calm, and Sample Rough quick test presets.
    Loads real SAR sample images corresponding to each preset or accepts uploaded synthetic tiles.
    """
    start_time = time.perf_counter()
    preset_name = (preset or "slick").lower().strip()
    image_bytes = None
    filename = f"preset_{preset_name}.jpg"

    # 1. If file uploaded directly, use its contents
    if file is not None:
        image_bytes = await file.read()
        filename = file.filename or filename

    # 2. Otherwise load corresponding sample image from project disk
    if not image_bytes:
        sample_path = _resolve_sample_preset_path(preset_name)
        if sample_path and sample_path.exists():
            image_bytes = sample_path.read_bytes()
            filename = sample_path.name
        else:
            # Fallback deterministic synthetic image generation if sample files are missing
            from PIL import Image, ImageDraw
            img = Image.new('RGB', (224, 224), color=(110, 110, 110))
            draw = ImageDraw.Draw(img)
            if "slick" in preset_name or "oil" in preset_name:
                # Draw dark slick ellipse representing oil damping
                draw.ellipse([40, 60, 180, 160], fill=(20, 20, 25))
            else:
                # Clean sea with natural speckle variations
                draw.rectangle([0, 0, 224, 224], fill=(125, 125, 130))
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            image_bytes = buf.getvalue()

    # 3. Run real inference
    try:
        result = predict(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthetic inference error: {str(e)}")

    processing_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
    now_iso = datetime.utcnow().isoformat() + "Z"
    is_oil = bool(result["oil_detected"])
    classification_str = "OIL SPILL" if is_oil else "CLEAN OCEAN"

    # 4. Save to history
    record_id = save_prediction(
        filename=filename,
        oil_detected=is_oil,
        confidence=result["confidence"],
        raw_score=result["raw_score"],
        file_size_bytes=len(image_bytes),
        image_sha256=result.get("image_sha256")
    )

    return JSONResponse(content={
        "prediction": "OIL SPILL" if is_oil else "CLEAN",
        "confidence": round(float(result["confidence"]), 4),
        "raw_probability": round(float(result["raw_score"]), 4),
        "processing_time_ms": processing_time_ms,
        "model": result.get("model", "oil-spill-classifier"),
        "preset": preset_name,
        "classification": classification_str,
        "filename": filename,
        "is_oil_spill": is_oil,
        "oil_detected": is_oil,
        "raw_score": round(float(result["raw_score"]), 4),
        "threshold": 0.50,
        "timestamp": now_iso,
        "record_id": record_id,
        "status": "ok"
    })

@app.get("/history")
def get_history(limit: int = Query(50, ge=1, le=500), oil_only: Optional[bool] = None):
    """Fetches historical scan records from database audit table."""
    records = get_recent_records(limit=limit, filter_oil=oil_only)
    return {
        "status": "ok",
        "count": len(records),
        "records": records
    }

@app.get("/stats")
def get_stats():
    """Returns real-time aggregate statistics from database."""
    stats = get_database_stats()
    return {
        "status": "ok",
        "statistics": stats
    }

@app.delete("/history")
def clear_history_endpoint():
    """Clears scan audit records."""
    success = clear_all_records()
    return {
        "status": "ok" if success else "error",
        "message": "Scan history cleared" if success else "Failed to clear history"
    }

@app.get("/samples")
def list_sample_images():
    """Lists available SAR satellite demo images."""
    for s_dir in CANDIDATE_SAMPLE_DIRS:
        if s_dir.exists():
            files = list(s_dir.glob("*.jpg")) + list(s_dir.glob("*.png"))
            if files:
                return {
                    "status": "ok",
                    "directory": str(s_dir),
                    "samples": [{"filename": f.name, "url": f"/samples/{f.name}"} for f in files]
                }
    return {"status": "ok", "samples": []}

@app.get("/samples/{filename}")
def get_sample_image(filename: str):
    """Retrieves a sample SAR image file."""
    for s_dir in CANDIDATE_SAMPLE_DIRS:
        p = s_dir / filename
        if p.exists() and p.is_file():
            return FileResponse(p)
    raise HTTPException(status_code=404, detail="Sample image not found.")

@app.get("/ui")
def serve_ui():
    """Serves the frontend application directly from the backend server."""
    index_file = PROJECT_ROOT / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="index.html not found.")

def start():
    """Entrypoint function for starting server programmatically."""
    uvicorn.run("backend.app:app", host=HOST, port=PORT, reload=False)

if __name__ == "__main__":
    start()
