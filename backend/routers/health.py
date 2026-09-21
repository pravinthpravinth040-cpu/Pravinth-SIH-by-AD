from datetime import datetime
from fastapi import APIRouter
from backend.database import get_db_status
from backend.inference import get_model_info
from backend.services.ais_service import ais_service
from backend.services.satellite_service import satellite_service

router = APIRouter(tags=["Health & Status"])

@router.get("/")
def get_root_status():
    """Root status endpoint."""
    return {
        "status": "online",
        "service": "Oil Spill AI Backend",
        "message": "Sentinel-1 SAR Oil Spill Classification & AIS Correlation Engine is running.",
        "version": "1.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "documentation": "/docs",
        "database": get_db_status()["status"],
        "model": get_model_info()["architecture"]
    }

@router.get("/api/health")
def get_api_health():
    """Standardized API health probe required by specification."""
    return {
        "status": "online",
        "service": "Oil Spill AI Backend",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0",
        "data_sources": {
            "ais": ais_service.get_source_label(),
            "satellite": satellite_service.get_source_label(),
            "database": get_db_status()["status"],
            "ai_model": "ACTIVE"
        }
    }

@router.get("/health")
def get_legacy_health():
    """Liveness probe for Render and cloud monitoring services."""
    return {
        "status": "ok",
        "service": "sentinel-1-sar-oil-spill-api",
        "online": True,
        "database": get_db_status(),
        "model": get_model_info()
    }
