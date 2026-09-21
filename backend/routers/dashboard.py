from datetime import datetime
from fastapi import APIRouter
from backend.database import get_db_session, get_database_stats, get_db_status, VesselModel, OilSpillModel, SatelliteObservationModel
from backend.services.ais_service import ais_service
from backend.services.satellite_service import satellite_service
from backend.inference import get_model_info

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Intelligence"])

@router.get("/summary")
def get_dashboard_summary():
    """Returns all key dashboard statistics, metrics, and live system status."""
    session = get_db_session()
    vessel_count = 0
    tanker_count = 0
    cargo_count = 0
    spill_count = 0
    satellite_count = 0

    if session:
        try:
            vessel_count = session.query(VesselModel).count()
            tanker_count = session.query(VesselModel).filter(VesselModel.vessel_type.ilike("%tanker%")).count()
            cargo_count = session.query(VesselModel).filter(VesselModel.vessel_type.ilike("%cargo%")).count()
            spill_count = session.query(OilSpillModel).count()
            satellite_count = session.query(SatelliteObservationModel).count()
        finally:
            session.close()

    db_stats = get_database_stats()
    db_status = get_db_status()

    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "system_status": {
            "backend": "ONLINE",
            "database": db_status["status"],
            "ais_feed": ais_service.get_source_label(),
            "satellite_feed": satellite_service.get_source_label(),
            "ai_model": "ONLINE"
        },
        "statistics": {
            "total_vessels_tracked": vessel_count,
            "tankers_active": tanker_count,
            "cargo_vessels": cargo_count,
            "detected_oil_spills": spill_count,
            "satellite_passes_indexed": satellite_count,
            "total_tiles_scanned": db_stats.get("total_scans", 0),
            "flagged_spill_tiles": db_stats.get("oil_spills", 0),
            "clean_ocean_tiles": db_stats.get("clean_oceans", 0)
        },
        "model_telemetry": get_model_info()
    }
