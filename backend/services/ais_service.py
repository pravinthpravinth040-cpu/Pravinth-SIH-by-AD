import math
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db_session, VesselModel, AISTrackModel
from backend.models.ais import AISVesselRecord, AISTrackPoint, AISVesselDetail

# Haversine distance calculator in kilometers
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class AISService:
    def __init__(self):
        self.preferred_source = os.getenv("AIS_SOURCE", "AISStream / NOAA AIS")

    @property
    def api_key(self) -> str:
        return os.getenv("AISSTREAM_API_KEY", "").strip()

    def is_live_source_available(self) -> bool:
        """Determines if a real-time live AIS streaming feed is configured."""
        return bool(self.api_key)

    def get_source_label(self) -> str:
        """Returns the data source attribution label."""
        return "LIVE" if self.is_live_source_available() else "HISTORICAL"

    def get_latest_vessels(
        self,
        vessel_type: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieves active vessels from the database or external stream.
        Accurately flags source as LIVE or HISTORICAL.
        """
        session = get_db_session()
        if not session:
            return []

        try:
            query = session.query(VesselModel)
            if vessel_type and vessel_type.lower() != "all":
                query = query.filter(VesselModel.vessel_type.ilike(f"%{vessel_type}%"))
            if search and search.strip():
                term = f"%{search.strip()}%"
                query = query.filter(
                    (VesselModel.vessel_name.ilike(term)) |
                    (VesselModel.mmsi.ilike(term)) |
                    (VesselModel.destination.ilike(term))
                )

            vessels = query.order_by(desc(VesselModel.updated_at)).limit(limit).all()
            results = []
            source_tag = self.get_source_label()

            for v in vessels:
                data = v.to_dict()
                # Ensure we never falsely label historical data as LIVE
                if not self.is_live_source_available():
                    data["source"] = "HISTORICAL"
                else:
                    data["source"] = "LIVE"
                results.append(data)
            return results
        finally:
            session.close()

    def get_vessel_details(self, mmsi: str) -> Optional[Dict[str, Any]]:
        """Retrieves single vessel record plus its historical coordinate track."""
        session = get_db_session()
        if not session:
            return None

        try:
            vessel = session.query(VesselModel).filter(VesselModel.mmsi == mmsi).first()
            if not vessel:
                return None

            v_dict = vessel.to_dict()
            if not self.is_live_source_available():
                v_dict["source"] = "HISTORICAL"

            tracks = (
                session.query(AISTrackModel)
                .filter(AISTrackModel.mmsi == mmsi)
                .order_by(AISTrackModel.timestamp.asc())
                .all()
            )

            history = [t.to_dict() for t in tracks]
            return {
                "vessel": v_dict,
                "history": history,
                "track_count": len(history)
            }
        finally:
            session.close()

    def get_historical_tracks(
        self,
        mmsi: Optional[str] = None,
        limit: int = 200
    ) -> List[Dict[str, Any]]:
        """Fetches historical AIS vessel tracks."""
        session = get_db_session()
        if not session:
            return []

        try:
            query = session.query(AISTrackModel)
            if mmsi:
                query = query.filter(AISTrackModel.mmsi == mmsi)
            tracks = query.order_by(desc(AISTrackModel.timestamp)).limit(limit).all()
            return [t.to_dict() for t in tracks]
        finally:
            session.close()

    def find_nearby_vessels(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 50.0
    ) -> List[Dict[str, Any]]:
        """
        Geospatially filters vessels within radius_km of coordinates.
        Calculates exact distance and bearing.
        """
        session = get_db_session()
        if not session:
            return []

        try:
            all_vessels = session.query(VesselModel).all()
            nearby = []
            for v in all_vessels:
                dist = haversine_distance(latitude, longitude, v.latitude, v.longitude)
                if dist <= radius_km:
                    item = v.to_dict()
                    item["distance_km"] = round(dist, 2)
                    nearby.append(item)

            nearby.sort(key=lambda x: x["distance_km"])
            return nearby
        finally:
            session.close()


ais_service = AISService()
