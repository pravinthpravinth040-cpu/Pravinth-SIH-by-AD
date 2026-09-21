from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class OilDriftPrediction(BaseModel):
    hours_ahead: int
    predicted_lat: float
    predicted_lon: float
    wind_influence_kts: float
    current_influence_kts: float
    drift_heading_deg: float
    confidence_decay: float

class EnvironmentalConditions(BaseModel):
    wind_speed_kts: float = 12.5
    wind_direction_deg: float = 240.0
    ocean_current_speed_kts: float = 1.2
    ocean_current_direction_deg: float = 135.0
    water_temperature_c: float = 28.4
    sea_state: str = "Moderate (Beaufort 3-4)"

class OilSpillRecord(BaseModel):
    spill_id: str = Field(..., description="Unique spill identification string (e.g. OS-001)")
    detection_timestamp: str = Field(..., description="UTC ISO timestamp of detection")
    latitude: float = Field(..., description="Estimated centroid latitude")
    longitude: float = Field(..., description="Estimated centroid longitude")
    estimated_area_km2: float = Field(..., ge=0.0, description="Surface area of slick in km²")
    perimeter_km: Optional[float] = Field(default=None, description="Perimeter boundary length in km")
    length_km: Optional[float] = Field(default=None, description="Max slick length along drift axis in km")
    width_km: Optional[float] = Field(default=None, description="Max width across drift axis in km")
    shape: Optional[str] = Field(default="Linear Feathering", description="Slick morphology: Linear, Patchy, Elongated, etc.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI model confidence score (0.0 - 1.0)")
    estimated_age_hours: Optional[float] = Field(default=None, description="Estimated hours elapsed since discharge")
    source_satellite: str = Field(default="Sentinel-1", description="Satellite sensor used")
    image_acquisition_time: str = Field(..., description="Satellite SAR pass timestamp")
    status: str = Field(default="DETECTED", description="DETECTED, ANALYZED, MONITORING, RESOLVED")
    location_name: Optional[str] = Field(default="Arabian Sea", description="Maritime zone or sea name")
    environmental: Optional[EnvironmentalConditions] = None
    drift_predictions: Optional[List[OilDriftPrediction]] = []
    source: str = Field(default="DEMO/DATASET", description="LIVE, HISTORICAL, or DEMO/DATASET")

class VesselCorrelationRank(BaseModel):
    rank: int = Field(..., description="Proximity and trajectory match ranking")
    mmsi: str = Field(..., description="Vessel MMSI")
    vessel_name: str = Field(..., description="Vessel name")
    vessel_type: str = Field(default="Tanker")
    distance_km: float = Field(..., description="Distance between vessel track and spill centroid in km")
    time_difference_hours: float = Field(..., description="Time difference between vessel presence and spill age")
    trajectory_match: float = Field(..., ge=0.0, le=1.0, description="Alignment between vessel course and spill elongation")
    proximity_score: float = Field(..., ge=0.0, le=1.0, description="Spatial proximity score")
    overall_score: float = Field(..., ge=0.0, le=1.0, description="Composite risk/correlation score")
    risk_level: str = Field(default="Medium", description="High, Medium, or Low correlation indicator")
    disclaimer: str = Field(
        default="Analytical correlation/risk indicator only. Does NOT constitute proof of liability or causal pollution.",
        description="Mandatory legal disclaimer"
    )

class SpillAnalysisResponse(BaseModel):
    spill: OilSpillRecord
    ranked_vessels: List[VesselCorrelationRank] = []
    drift_forecast: List[OilDriftPrediction] = []
    summary: Dict[str, Any] = {}
