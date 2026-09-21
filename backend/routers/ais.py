from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from backend.services.ais_service import ais_service

router = APIRouter(prefix="/api/ais", tags=["AIS Vessel Tracking"])

@router.get("/live")
def get_live_ais(
    vessel_type: Optional[str] = Query(None, description="Filter by vessel category (e.g. Tanker, Cargo)"),
    search: Optional[str] = Query(None, description="Search vessel name or MMSI"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Returns current/latest available AIS vessel information.
    Accurately tags source as LIVE or HISTORICAL.
    """
    vessels = ais_service.get_latest_vessels(vessel_type=vessel_type, search=search, limit=limit)
    return {
        "status": "ok",
        "source": ais_service.get_source_label(),
        "count": len(vessels),
        "vessels": vessels
    }

@router.get("/history")
def get_ais_history(
    mmsi: Optional[str] = Query(None, description="Filter tracks by vessel MMSI"),
    limit: int = Query(200, ge=1, le=1000)
):
    """Returns historical AIS vessel tracks."""
    tracks = ais_service.get_historical_tracks(mmsi=mmsi, limit=limit)
    return {
        "status": "ok",
        "count": len(tracks),
        "tracks": tracks
    }

@router.get("/vessel/{mmsi}")
def get_ais_vessel(mmsi: str):
    """Returns information and historical movement for a specific vessel."""
    detail = ais_service.get_vessel_details(mmsi=mmsi)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Vessel with MMSI {mmsi} not found.")
    return {
        "status": "ok",
        "data": detail
    }
