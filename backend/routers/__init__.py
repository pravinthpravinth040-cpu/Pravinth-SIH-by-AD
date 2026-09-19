from backend.routers.health import router as health_router
from backend.routers.ais import router as ais_router
from backend.routers.satellite import router as satellite_router
from backend.routers.oil_spill import router as oil_spill_router
from backend.routers.vessels import router as vessels_router
from backend.routers.dashboard import router as dashboard_router

__all__ = [
    "health_router",
    "ais_router",
    "satellite_router",
    "oil_spill_router",
    "vessels_router",
    "dashboard_router",
]
