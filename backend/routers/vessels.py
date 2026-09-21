from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.services.ais_service import ais_service
from backend.services.vessel_ranking_service import vessel_ranking_service, CORRELATION_DISCLAIMER

router = APIRouter(prefix="/api/vessels", tags=["Vessel Analysis & Risk Correlation"])

@router.get("/nearby")
def get_nearby_vessels(
    lat: float = Query(..., description="Target centroid latitude"),
    lon: float = Query(..., description="Target centroid longitude"),
    radius_km: float = Query(50.0, ge=1.0, le=300.0, description="Search radius in kilometers")
):
    """Returns vessels near a selected GPS or spill location."""
    vessels = ais_service.find_nearby_vessels(latitude=lat, longitude=lon, radius_km=radius_km)
    return {
        "status": "ok",
        "center": {"lat": lat, "lon": lon},
        "radius_km": radius_km,
        "count": len(vessels),
        "vessels": vessels
    }

@router.get("/ranking/{spill_id}")
def get_vessel_ranking(
    spill_id: str,
    max_distance_km: float = Query(60.0, ge=5.0, le=200.0),
    max_time_hours: float = Query(12.0, ge=1.0, le=48.0)
):
    """
    Returns vessels ranked according to their spatial and trajectory correlation with the spill.
    Includes mandatory disclaimer that scores represent analytical correlation, not liability.
    """
    ranking = vessel_ranking_service.rank_vessels_for_spill(
        spill_id=spill_id,
        max_distance_km=max_distance_km,
        max_time_hours=max_time_hours
    )
    return {
        "status": "ok",
        "spill_id": spill_id,
        "candidates_count": len(ranking),
        "ranked_vessels": ranking,
        "disclaimer": CORRELATION_DISCLAIMER
    }
