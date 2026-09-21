from typing import Optional, List
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float

class SatelliteObservationRecord(BaseModel):
    scene_id: str = Field(..., description="Sentinel-1 Granule / Product Identifier")
    satellite_name: str = Field(default="Sentinel-1A", description="Satellite platform (Sentinel-1A, Sentinel-1B)")
    acquisition_time: str = Field(..., description="UTC ISO acquisition start timestamp")
    latitude: float = Field(..., description="Center latitude of observation tile")
    longitude: float = Field(..., description="Center longitude of observation tile")
    bounding_box: BoundingBox = Field(..., description="Geographical extent of scene")
    orbit_number: Optional[int] = Field(default=None, description="Absolute orbit number")
    orbit_direction: Optional[str] = Field(default="DESCENDING", description="Orbit direction: ASCENDING or DESCENDING")
    polarization: str = Field(default="VV+VH", description="Radar polarization mode (e.g. VV, VV+VH)")
    resolution_m: float = Field(default=10.0, description="Spatial resolution in meters")
    cloud_cover: float = Field(default=0.0, description="Cloud cover percentage (SAR radar penetrates clouds)")
    image_url: Optional[str] = Field(default=None, description="Public browse or asset URL")
    processing_status: str = Field(default="PROCESSED", description="RAW, PREPROCESSED, PROCESSED, ANALYZED")
    oil_detected: bool = Field(default=False, description="Whether oil slicks were identified in scene")
    source: str = Field(default="DEMO/DATASET", description="LIVE, HISTORICAL, or DEMO/DATASET")
