from typing import Optional, List
from pydantic import BaseModel, Field

class AISVesselRecord(BaseModel):
    mmsi: str = Field(..., description="Maritime Mobile Service Identity (9-digit identifier)")
    vessel_name: str = Field(..., description="Official ship name or callsign")
    vessel_type: str = Field(default="Unknown", description="Vessel category (Tanker, Cargo, Tug, Fishing, Passenger)")
    flag: Optional[str] = Field(default=None, description="Flag state country code or name")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Current latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Current longitude in decimal degrees")
    speed: float = Field(default=0.0, ge=0.0, description="Speed over ground in knots")
    course: float = Field(default=0.0, ge=0.0, le=360.0, description="Course over ground in degrees")
    heading: Optional[float] = Field(default=None, ge=0.0, le=360.0, description="True ship heading in degrees")
    destination: Optional[str] = Field(default=None, description="Reported destination port")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of observation")
    source: str = Field(default="HISTORICAL", description="Data source indicator: LIVE, HISTORICAL, or DEMO/DATASET")

class AISTrackPoint(BaseModel):
    latitude: float
    longitude: float
    speed: float
    course: float
    timestamp: str
    source: str = "HISTORICAL"

class AISVesselDetail(BaseModel):
    vessel: AISVesselRecord
    history: List[AISTrackPoint] = []
    track_count: int = 0
