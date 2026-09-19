from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.services.satellite_service import satellite_service

router = APIRouter(prefix="/api/satellite", tags=["Satellite & Sentinel-1 Data"])

@router.get("/latest")
def get_latest_satellite(limit: int = Query(10, ge=1, le=50)):
    """Returns latest available satellite/SAR dataset information."""
    observations = satellite_service.get_latest_observations(limit=limit)
    return {
        "status": "ok",
        "source": satellite_service.get_source_label(),
        "count": len(observations),
        "observations": observations
    }

@router.get("/history")
def get_satellite_history(
    date_from: Optional[str] = Query(None, description="Start date ISO string (e.g. 2026-09-01)"),
    date_to: Optional[str] = Query(None, description="End date ISO string (e.g. 2026-09-20)"),
    limit: int = Query(50, ge=1, le=200)
):
    """Returns historical satellite observations with optional temporal filtering."""
    observations = satellite_service.get_historical_observations(
        date_from=date_from,
        date_to=date_to,
        limit=limit
    )
    return {
        "status": "ok",
        "count": len(observations),
        "observations": observations
    }
