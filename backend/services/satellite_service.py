import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import desc

from backend.database import get_db_session, SatelliteObservationModel
from backend.models.satellite import SatelliteObservationRecord, BoundingBox

class SatelliteService:
    def __init__(self):
        self.copernicus_user = os.getenv("COPERNICUS_USERNAME", "").strip()
        self.copernicus_client_id = os.getenv("COPERNICUS_CLIENT_ID", "").strip()

    def get_source_label(self) -> str:
        """Accurately identifies satellite data feed type."""
        if self.copernicus_user or self.copernicus_client_id:
            return "LIVE"
        return "DEMO/DATASET"

    def get_latest_observations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieves most recent Sentinel-1 SAR observations."""
        session = get_db_session()
        if not session:
            return []

        try:
            records = (
                session.query(SatelliteObservationModel)
                .order_by(desc(SatelliteObservationModel.acquisition_time))
                .limit(limit)
                .all()
            )
            results = []
            source_tag = self.get_source_label()
            for r in records:
                d = r.to_dict()
                if source_tag == "LIVE":
                    d["source"] = "LIVE"
                results.append(d)
            return results
        finally:
            session.close()

    def get_historical_observations(
        self,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Retrieves historical Sentinel-1 SAR observations with optional date filtering."""
        session = get_db_session()
        if not session:
            return []

        try:
            query = session.query(SatelliteObservationModel)
            if date_from:
                query = query.filter(SatelliteObservationModel.acquisition_time >= date_from)
            if date_to:
                query = query.filter(SatelliteObservationModel.acquisition_time <= date_to)

            records = query.order_by(desc(SatelliteObservationModel.acquisition_time)).limit(limit).all()
            return [r.to_dict() for r in records]
        finally:
            session.close()

    def get_by_scene_id(self, scene_id: str) -> Optional[Dict[str, Any]]:
        """Finds a specific Sentinel-1 scene by Granule ID."""
        session = get_db_session()
        if not session:
            return None

        try:
            record = (
                session.query(SatelliteObservationModel)
                .filter(SatelliteObservationModel.scene_id == scene_id)
                .first()
            )
            return record.to_dict() if record else None
        finally:
            session.close()


satellite_service = SatelliteService()
