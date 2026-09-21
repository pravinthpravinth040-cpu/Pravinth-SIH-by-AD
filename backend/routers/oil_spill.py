from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel
from backend.services.oil_spill_service import oil_spill_service
from backend.services.vessel_ranking_service import vessel_ranking_service

router = APIRouter(prefix="/api/oil-spills", tags=["Oil Spill AI Detection"])

class SpillAnalyzeRequest(BaseModel):
    spill_id: str

@router.get("")
def list_oil_spills(
    status: Optional[str] = Query(None, description="Filter by status (DETECTED, ANALYZED, MONITORING)"),
    limit: int = Query(50, ge=1, le=100)
):
    """Returns detected oil-spill records."""
    spills = oil_spill_service.get_all_spills(status=status, limit=limit)
    return {
        "status": "ok",
        "count": len(spills),
        "spills": spills
    }

@router.get("/{spill_id}")
def get_oil_spill_details(spill_id: str):
    """Returns detailed information about one oil spill."""
    spill = oil_spill_service.get_spill_by_id(spill_id=spill_id)
    if not spill:
        raise HTTPException(status_code=404, detail=f"Oil spill record {spill_id} not found.")
    return {
        "status": "ok",
        "spill": spill
    }

@router.post("/detect")
async def detect_oil_spill(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(9.985),
    longitude: Optional[float] = Form(75.885)
):
    """Accepts SAR satellite image and runs the AI oil-spill detection pipeline."""
    allowed_exts = ('.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff')
    if file.filename and not any(file.filename.lower().endswith(ext) for ext in allowed_exts):
        raise HTTPException(status_code=400, detail="File must be a valid image (.jpg, .png, .tif)")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    result = oil_spill_service.run_detection_pipeline(
        image_bytes=contents,
        filename=file.filename or "uploaded_sar_tile.jpg",
        latitude=latitude or 9.985,
        longitude=longitude or 75.885
    )
    return {
        "status": "ok",
        "data": result
    }

@router.post("/analyze")
def analyze_detected_spill(payload: SpillAnalyzeRequest):
    """
    Analyzes a detected spill:
    Computes environmental drift simulation and correlates nearby candidate AIS vessels.
    """
    spill = oil_spill_service.get_spill_by_id(payload.spill_id)
    if not spill:
        raise HTTPException(status_code=404, detail=f"Oil spill {payload.spill_id} not found.")

    ranked_vessels = vessel_ranking_service.rank_vessels_for_spill(payload.spill_id)
    return {
        "status": "ok",
        "spill_id": payload.spill_id,
        "spill_details": spill,
        "drift_forecast": spill.get("drift_predictions", []),
        "ranked_vessels": ranked_vessels,
        "candidate_count": len(ranked_vessels)
    }
