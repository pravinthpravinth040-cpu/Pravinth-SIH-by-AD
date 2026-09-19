import math
from typing import List, Dict, Any, Optional
from datetime import datetime

from backend.database import (
    get_db_session, OilSpillModel, VesselModel, AISTrackModel,
    SpillVesselCorrelationModel
)
from backend.services.ais_service import haversine_distance

CORRELATION_DISCLAIMER = (
    "Analytical correlation/risk indicator only. "
    "Calculated mathematically from AIS spatial proximity and course vectors. "
    "Does NOT constitute legal evidence or proof of causal pollution."
)

class VesselRankingService:
    def rank_vessels_for_spill(
        self,
        spill_id: str,
        max_distance_km: float = 60.0,
        max_time_hours: float = 12.0
    ) -> List[Dict[str, Any]]:
        """
        AIS Correlation Engine:
        Searches AIS tracks and vessel positions within spatio-temporal boundary of spill.
        Calculates proximity score, trajectory alignment, time difference, and composite correlation score.
        """
        session = get_db_session()
        if not session:
            return []

        try:
            spill = session.query(OilSpillModel).filter(OilSpillModel.spill_id == spill_id).first()
            if not spill:
                return []

            spill_lat = spill.latitude
            spill_lon = spill.longitude
            spill_age_hours = spill.estimated_age_hours or 3.0

            # Default assumed discharge track heading from spill morphology / elongation
            spill_orientation_deg = 330.0

            vessels = session.query(VesselModel).all()
            scored_candidates = []

            for v in vessels:
                # 1. Proximity Calculation (km)
                dist_km = haversine_distance(spill_lat, spill_lon, v.latitude, v.longitude)
                if dist_km > max_distance_km:
                    continue

                # 2. Time Difference (hours)
                # Compare vessel latest report vs spill age window
                time_diff_hours = abs(spill_age_hours - 2.0) + (dist_km / max(v.speed * 1.852, 5.0))
                time_diff_hours = round(min(time_diff_hours, max_time_hours), 1)

                # 3. Trajectory Match Score (0.0 to 1.0)
                # Angle difference between vessel course and spill orientation
                course = v.course or 0.0
                angle_diff = abs(course - spill_orientation_deg)
                if angle_diff > 180.0:
                    angle_diff = 360.0 - angle_diff

                trajectory_match = max(0.1, 1.0 - (angle_diff / 180.0))
                if "tanker" in (v.vessel_type or "").lower():
                    # Cargo/Tanker nature elevates risk relevance
                    type_multiplier = 1.05
                elif "cargo" in (v.vessel_type or "").lower():
                    type_multiplier = 1.0
                else:
                    type_multiplier = 0.85

                # 4. Proximity Score (inverse exponential distance decay)
                proximity_score = max(0.0, 1.0 - (dist_km / max_distance_km))

                # 5. Composite Analytical Risk Score
                # Weights: Proximity 45%, Trajectory 35%, Time Window 20%
                time_score = max(0.0, 1.0 - (time_diff_hours / max_time_hours))
                raw_composite = (
                    (proximity_score * 0.45) +
                    (trajectory_match * 0.35) +
                    (time_score * 0.20)
                ) * type_multiplier

                overall_score = round(min(max(raw_composite, 0.05), 0.98), 3)

                # Risk Categorization
                if overall_score >= 0.75:
                    risk_level = "High"
                elif overall_score >= 0.45:
                    risk_level = "Medium"
                else:
                    risk_level = "Low"

                scored_candidates.append({
                    "spill_id": spill_id,
                    "mmsi": v.mmsi,
                    "vessel_name": v.vessel_name,
                    "vessel_type": v.vessel_type,
                    "distance_km": round(dist_km, 2),
                    "time_difference_hours": time_diff_hours,
                    "trajectory_match": round(trajectory_match, 3),
                    "proximity_score": round(proximity_score, 3),
                    "overall_score": overall_score,
                    "risk_level": risk_level,
                    "disclaimer": CORRELATION_DISCLAIMER
                })

            # Sort by highest correlation score descending
            scored_candidates.sort(key=lambda x: x["overall_score"], reverse=True)

            # Assign integer rank (1, 2, 3...)
            for idx, item in enumerate(scored_candidates, 1):
                item["rank"] = idx

            return scored_candidates
        finally:
            session.close()


vessel_ranking_service = VesselRankingService()
