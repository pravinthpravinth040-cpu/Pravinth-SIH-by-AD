import os
import sys
import time
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
    ALLOWED_ORIGINS
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Service status and API registry endpoint."""
    return {
        "status": "ok",
        "service": "oil-spill-detector",
        "message": "Oil Spill Detection API is running. Use POST /predict to upload an image.",
        "endpoints": {
            "health": "GET /health",
            "predict": "POST /predict",
            "history": "GET /history",
            "stats": "GET /stats",
            "samples": "GET /samples",
            "documentation": "GET /docs"
        },
        "database": get_db_status()["status"] if "status" in get_db_status() else get_db_status()["message"],
        "model": get_model_info()
    }

@app.get("/health")
def health_check():
    """Liveness probe for monitoring platforms and frontend connectivity."""
    db_info = get_db_status()
    model_info = get_model_info()
    return {
        "status": "healthy",
        "service": "oil-spill-detector",
        "database": db_info,
        "model": model_info
    }

@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    """
    Accepts a SAR satellite image tile and returns whether an oil spill was detected.
    Automatically logs telemetry into the MySQL database (prediction_records).
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

    # 4. Database Audit Persistence
    record_id = save_prediction(
        filename=file.filename or "uploaded_image.jpg",
        oil_detected=result["oil_detected"],
        confidence=result["confidence"],
        raw_score=result["raw_score"],
        file_size_bytes=result.get("file_size_bytes"),
        image_sha256=result.get("image_sha256")
    )

    # 5. Build standardized response matching API contract
    prediction_label = "oil_spill" if result["oil_detected"] else "clean_ocean"
    return JSONResponse(content={
        "prediction": prediction_label,
        "oil_detected": result["oil_detected"],
        "confidence": round(result["confidence"], 4),
        "raw_score": round(result["raw_score"], 4),
        "raw_probability": round(result["raw_score"], 4),
        "model": "ResNet-18",
        "filename": file.filename or "unknown",
        "processing_time_ms": processing_time_ms,
        "record_id": record_id,
        "status": "processed"
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
        "message": "Audit history cleared" if success else "Failed to clear history"
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
