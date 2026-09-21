import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, DateTime,
    Text, ForeignKey, desc, text, func
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship

from backend.config import PROJECT_ROOT

Base = declarative_base()

# ── Database URL Resolution ─────────────────────────────────────────────────────
# Priority:
#   1. DATABASE_URL env var  (MySQL, PostgreSQL, or SQLite explicit)
#   2. Auto-construct from DB_ENGINE / DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
#   3. SQLite fallback (sar_oil_spill.db)

_raw_db_url = os.getenv("DATABASE_URL", "").strip()

if _raw_db_url:
    # Normalise postgres:// → postgresql://
    if _raw_db_url.startswith("postgres://"):
        DATABASE_URL = _raw_db_url.replace("postgres://", "postgresql://", 1)
    else:
        DATABASE_URL = _raw_db_url
else:
    # Auto-construct from individual env vars
    _engine_type = os.getenv("DB_ENGINE", "sqlite").lower()
    if _engine_type == "mysql":
        _host   = os.getenv("DB_HOST", "localhost")
        _port   = os.getenv("DB_PORT", "3306")
        _name   = os.getenv("DB_NAME", "oil_spilling")
        _user   = os.getenv("DB_USER", "root")
        _passwd = os.getenv("DB_PASSWORD", "")
        DATABASE_URL = f"mysql+pymysql://{_user}:{_passwd}@{_host}:{_port}/{_name}"
    else:
        DB_PATH = PROJECT_ROOT / "sar_oil_spill.db"
        DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

IS_MYSQL    = DATABASE_URL.startswith("mysql")
IS_POSTGRES = DATABASE_URL.startswith("postgresql")
IS_SQLITE   = DATABASE_URL.startswith("sqlite")
DB_PATH     = None if (IS_MYSQL or IS_POSTGRES) else (PROJECT_ROOT / "sar_oil_spill.db")


# ══════════════════════════════════════════════════════════════════════════════
# ORM MODELS — mapped to existing MySQL oil_spilling tables
# ══════════════════════════════════════════════════════════════════════════════

class PredictionRecord(Base):
    """Scan audit log for SAR tile classifications (auto-created if missing)."""
    __tablename__ = "prediction_records"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    filename        = Column(String(255), nullable=False)
    oil_detected    = Column(Boolean, nullable=False, index=True)
    confidence      = Column(Float, nullable=False)
    raw_score       = Column(Float, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    image_sha256    = Column(String(64), nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self) -> Dict[str, Any]:
        is_oil = bool(self.oil_detected)
        ts = self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        return {
            "id":               self.id,
            "filename":         self.filename,
            "classification":   "OIL SPILL" if is_oil else "CLEAN OCEAN",
            "is_oil_spill":     is_oil,
            "oil_detected":     is_oil,
            "confidence":       round(float(self.confidence), 4),
            "raw_score":        round(float(self.raw_score), 4),
            "raw_probability":  round(float(self.raw_score), 4),
            "threshold":        0.50,
            "model":            "PyTorch ResNet / ConvNet",
            "file_size_bytes":  self.file_size_bytes,
            "image_sha256":     self.image_sha256,
            "timestamp":        ts,
            "created_at":       ts,
        }


class VesselModel(Base):
    """
    Maps to MySQL: ais_records
    Columns used: mmsi, vessel_name, vessel_type, lat, lon, sog, cog, heading,
                  status, is_synthetic, data_label, timestamp
    """
    __tablename__ = "ais_records"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    mmsi        = Column(String(50), nullable=False, index=True)
    vessel_name = Column(String(255), nullable=True)
    vessel_type = Column(String(100), nullable=True)
    timestamp   = Column(DateTime, nullable=True, index=True)
    latitude    = Column("lat",  Float, nullable=False)
    longitude   = Column("lon",  Float, nullable=False)
    speed       = Column("sog",  Float, default=0.0)
    course      = Column("cog",  Float, default=0.0)
    heading     = Column(Float, nullable=True)
    imo         = Column(String(50), nullable=True)
    callsign    = Column(String(50), nullable=True)
    destination = Column("status", String(100), nullable=True)
    source      = Column("data_label", String(50), nullable=True)
    dataset_id  = Column(Integer, nullable=True)
    is_synthetic = Column(Boolean, default=False)

    def to_dict(self) -> Dict[str, Any]:
        ts_str = (
            self.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(self.timestamp, datetime) else str(self.timestamp or "")
        )
        return {
            "mmsi":        self.mmsi,
            "vessel_name": self.vessel_name or f"Vessel-{self.mmsi}",
            "vessel_type": self.vessel_type or "Unknown",
            "flag":        None,
            "latitude":    round(float(self.latitude), 4),
            "longitude":   round(float(self.longitude), 4),
            "speed":       round(float(self.speed or 0), 1),
            "course":      round(float(self.course or 0), 1),
            "heading":     round(float(self.heading), 1) if self.heading is not None else None,
            "destination": self.destination,
            "timestamp":   ts_str,
            "source":      self.source or ("SYNTHETIC" if self.is_synthetic else "HISTORICAL"),
        }


class SatelliteObservationModel(Base):
    """
    Maps to MySQL: satellite_datasets
    Columns: id, name, image_id, acquisition_date, center_lat, center_lon,
             lat_min, lat_max, lon_min, lon_max, processing_status, data_label
    """
    __tablename__ = "satellite_datasets"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    scene_id         = Column("image_id", String(100), nullable=True, index=True)
    satellite_name   = Column("name", String(255), nullable=True)
    acquisition_time = Column("acquisition_date", DateTime, nullable=True, index=True)
    latitude         = Column("center_lat", Float, nullable=True)
    longitude        = Column("center_lon", Float, nullable=True)
    min_lat          = Column("lat_min", Float, nullable=True)
    max_lat          = Column("lat_max", Float, nullable=True)
    min_lon          = Column("lon_min", Float, nullable=True)
    max_lon          = Column("lon_max", Float, nullable=True)
    orbit_number     = Column(Integer, nullable=True)
    orbit_direction  = Column(String(50), nullable=True)
    polarization     = Column(String(20), nullable=True)
    processing_status = Column(String(50), nullable=True)
    oil_detected     = Column(Boolean, default=False)
    source           = Column("data_label", String(50), nullable=True)
    dataset_type     = Column(String(50), nullable=True)
    is_real_data     = Column(Boolean, default=False)
    created_at       = Column(DateTime, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        acq = (
            self.acquisition_time.strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(self.acquisition_time, datetime)
            else str(self.acquisition_time or "")
        )
        lat  = float(self.latitude  or 0)
        lon  = float(self.longitude or 0)
        return {
            "scene_id":          self.scene_id or f"SAT-{self.id}",
            "satellite_name":    self.satellite_name or "Sentinel-1",
            "acquisition_time":  acq,
            "latitude":          round(lat, 4),
            "longitude":         round(lon, 4),
            "bounding_box": {
                "min_lat": round(float(self.min_lat or lat - 1), 4),
                "max_lat": round(float(self.max_lat or lat + 1), 4),
                "min_lon": round(float(self.min_lon or lon - 1), 4),
                "max_lon": round(float(self.max_lon or lon + 1), 4),
            },
            "orbit_number":      self.orbit_number,
            "orbit_direction":   self.orbit_direction or "DESCENDING",
            "polarization":      self.polarization or "VV+VH",
            "resolution_m":      10.0,
            "cloud_cover":       0.0,
            "image_url":         None,
            "processing_status": self.processing_status or "PROCESSED",
            "oil_detected":      bool(self.oil_detected),
            "source":            self.source or ("REAL" if self.is_real_data else "DATASET"),
        }


class OilSpillModel(Base):
    """
    Maps to MySQL: oil_spills
    Columns: spill_id, detection_date, lat, lon, region_name, area_km2, confidence,
             severity, drift_direction, drift_speed_kn, model_name, created_at
    """
    __tablename__ = "oil_spills"

    id                    = Column(Integer, primary_key=True, autoincrement=True)
    spill_id              = Column(String(100), nullable=True, index=True)
    satellite_dataset_id  = Column(Integer, nullable=True)
    detection_timestamp   = Column("detection_date", DateTime, nullable=True, index=True)
    latitude              = Column("lat",  Float, nullable=False)
    longitude             = Column("lon",  Float, nullable=False)
    location_name         = Column("region_name", String(255), nullable=True)
    estimated_area_km2    = Column("area_km2", Float, nullable=True)
    confidence            = Column(Float, nullable=True)
    severity              = Column(String(50), nullable=True)
    spill_type            = Column(String(100), nullable=True)
    spread_km             = Column(Float, nullable=True)
    drift_direction       = Column(String(50), nullable=True)
    drift_speed_kn        = Column(Float, nullable=True)
    source_satellite      = Column("model_name", String(100), nullable=True)
    image_url             = Column(String(500), nullable=True)
    is_real_data          = Column(Boolean, default=False)
    source                = Column("data_label", String(50), nullable=True)
    created_at            = Column(DateTime, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        ts = (
            self.detection_timestamp.strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(self.detection_timestamp, datetime)
            else str(self.detection_timestamp or "")
        )
        sid = self.spill_id or f"SPILL-{self.id}"
        return {
            "spill_id":              sid,
            "detection_timestamp":   ts,
            "latitude":              round(float(self.latitude), 4),
            "longitude":             round(float(self.longitude), 4),
            "estimated_area_km2":    round(float(self.estimated_area_km2 or 0), 2),
            "perimeter_km":          None,
            "length_km":             round(float(self.spread_km), 2) if self.spread_km else None,
            "width_km":              None,
            "shape":                 self.spill_type or "Slick",
            "confidence":            round(float(self.confidence or 0), 4),
            "estimated_age_hours":   None,
            "source_satellite":      self.source_satellite or "Sentinel-1",
            "image_acquisition_time": ts,
            "status":                self.severity or "DETECTED",
            "location_name":         self.location_name or "Arabian Sea",
            "environmental": {
                "wind_speed_kts":              12.0,
                "wind_direction_deg":          240.0,
                "ocean_current_speed_kts":     float(self.drift_speed_kn or 1.0),
                "ocean_current_direction_deg": 130.0,
            },
            "source": self.source or ("REAL" if self.is_real_data else "DATASET"),
        }


class SpillVesselCorrelationModel(Base):
    """
    Maps to MySQL: vessel_attributions
    Columns: spill_id, mmsi, vessel_name, vessel_type, distance_km, time_diff_min,
             trajectory_consistency, attribution_score, status, rank
    """
    __tablename__ = "vessel_attributions"

    id                    = Column(Integer, primary_key=True, autoincrement=True)
    spill_id              = Column(String(100), nullable=False, index=True)
    mmsi                  = Column(String(50), nullable=False)
    vessel_name           = Column(String(255), nullable=True)
    vessel_type           = Column(String(100), nullable=True)
    distance_km           = Column(Float, nullable=True)
    time_difference_hours = Column("time_diff_min", Float, nullable=True)   # stored in minutes
    trajectory_match      = Column("trajectory_consistency", Float, nullable=True)
    overall_score         = Column("attribution_score", Float, nullable=True)  # single mapping
    risk_level            = Column("status", String(50), nullable=True)
    rank                  = Column(Integer, nullable=True)
    is_synthetic          = Column(Boolean, default=False)
    created_at            = Column(DateTime, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        time_hrs = (
            round(float(self.time_difference_hours) / 60, 2)
            if self.time_difference_hours else 0.0
        )
        score = round(float(self.overall_score or 0), 3)
        risk  = self.risk_level or ("High" if score > 0.7 else ("Medium" if score > 0.4 else "Low"))
        return {
            "id":                   self.id,
            "spill_id":             self.spill_id,
            "mmsi":                 self.mmsi,
            "vessel_name":          self.vessel_name or f"Vessel-{self.mmsi}",
            "vessel_type":          self.vessel_type or "Unknown",
            "distance_km":          round(float(self.distance_km or 0), 2),
            "time_difference_hours": time_hrs,
            "trajectory_match":     round(float(self.trajectory_match or 0), 3),
            "proximity_score":      round(float(self.proximity_score or 0), 3),
            "overall_score":        score,
            "risk_level":           risk,
            "rank":                 self.rank or 1,
            "disclaimer":           "Analytical correlation/risk indicator only. NOT proof of liability.",
        }


# ══════════════════════════════════════════════════════════════════════════════
# ENGINE & SESSION MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

_engine         = None
_SessionLocal   = None
_db_connected   = False
_db_status_msg  = "Uninitialized"


def _make_engine(url: str):
    """Create a SQLAlchemy engine with appropriate connect_args per dialect."""
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
    elif url.startswith("mysql"):
        return create_engine(
            url,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"charset": "utf8mb4"},
        )
    else:
        return create_engine(url, pool_pre_ping=True)


def _seed_initial_data(session: Session):
    """Seed sample data ONLY when tables are empty (safe for MySQL)."""
    sample_dir = PROJECT_ROOT / "backend" / "data" / "sample_data"
    if not sample_dir.exists():
        return

    try:
        # Only seed ais_records if empty
        if session.query(func.count(VesselModel.id)).scalar() == 0:
            ais_file = sample_dir / "sample_ais.json"
            if ais_file.exists():
                vessels_data = json.loads(ais_file.read_text(encoding="utf-8"))
                for v in vessels_data:
                    record = VesselModel(
                        mmsi=v["mmsi"],
                        vessel_name=v.get("vessel_name", f"Vessel-{v['mmsi']}"),
                        vessel_type=v.get("vessel_type", "Unknown"),
                        latitude=v["latitude"],
                        longitude=v["longitude"],
                        speed=v.get("speed", 0.0),
                        course=v.get("course", 0.0),
                        heading=v.get("heading"),
                        timestamp=datetime.utcnow(),
                        source=v.get("source", "HISTORICAL"),
                    )
                    session.add(record)

        # Only seed oil_spills if empty
        if session.query(func.count(OilSpillModel.id)).scalar() == 0:
            spill_file = sample_dir / "sample_spills.json"
            if spill_file.exists():
                spill_data = json.loads(spill_file.read_text(encoding="utf-8"))
                for sp in spill_data:
                    spill = OilSpillModel(
                        spill_id=sp["spill_id"],
                        latitude=sp["latitude"],
                        longitude=sp["longitude"],
                        estimated_area_km2=sp.get("estimated_area_km2", 0),
                        confidence=sp.get("confidence", 0.85),
                        location_name=sp.get("location_name", "Arabian Sea"),
                        source_satellite=sp.get("source_satellite", "Sentinel-1A"),
                        detection_timestamp=datetime.utcnow(),
                        source=sp.get("source", "DATASET"),
                    )
                    session.add(spill)

        # Only seed satellite_datasets if empty
        if session.query(func.count(SatelliteObservationModel.id)).scalar() == 0:
            sat_file = sample_dir / "sample_satellite.json"
            if sat_file.exists():
                sat_data = json.loads(sat_file.read_text(encoding="utf-8"))
                for s in sat_data:
                    bbox = s.get("bounding_box", {})
                    obs = SatelliteObservationModel(
                        scene_id=s["scene_id"],
                        satellite_name=s.get("satellite_name", "Sentinel-1A"),
                        latitude=s["latitude"],
                        longitude=s["longitude"],
                        min_lat=bbox.get("min_lat", s["latitude"] - 1),
                        max_lat=bbox.get("max_lat", s["latitude"] + 1),
                        min_lon=bbox.get("min_lon", s["longitude"] - 1),
                        max_lon=bbox.get("max_lon", s["longitude"] + 1),
                        processing_status=s.get("processing_status", "PROCESSED"),
                        oil_detected=s.get("oil_detected", False),
                        source=s.get("source", "DATASET"),
                        acquisition_time=datetime.utcnow(),
                    )
                    session.add(obs)

        session.commit()
        print("[DB] Sample data seeded successfully.")
    except Exception as e:
        session.rollback()
        print(f"[DB] Warning: Could not seed sample data: {e}")


def init_db() -> bool:
    """
    Initialise the database. Tries DATABASE_URL first (MySQL/PostgreSQL/SQLite).
    Falls back to local SQLite on any connection failure.
    Only creates tables that don't yet exist (safe for existing MySQL DBs).
    """
    global _engine, _SessionLocal, _db_connected, _db_status_msg, DATABASE_URL, IS_MYSQL, IS_POSTGRES, IS_SQLITE, DB_PATH

    primary_url = DATABASE_URL
    engine      = None
    connected   = False

    # ── Attempt primary DB ────────────────────────────────────────────────────
    try:
        engine = _make_engine(primary_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        connected = True
        if IS_MYSQL:
            db_label = "MySQL (oil_spilling)"
        elif IS_POSTGRES:
            db_label = "PostgreSQL"
        else:
            db_label = f"SQLite ({DB_PATH.name if DB_PATH else 'file'})"
        _db_status_msg = f"{db_label} connected"
        print(f"[DB] ✅ {_db_status_msg}")
    except Exception as e:
        print(f"[DB] ⚠️  Primary database failed ({type(e).__name__}: {e}). Falling back to SQLite.")
        connected = False

    # ── SQLite fallback ───────────────────────────────────────────────────────
    if not connected:
        try:
            DB_PATH     = PROJECT_ROOT / "sar_oil_spill.db"
            DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"
            IS_MYSQL    = False
            IS_POSTGRES = False
            IS_SQLITE   = True
            engine      = _make_engine(DATABASE_URL)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            connected       = True
            _db_status_msg  = f"SQLite connected · {DB_PATH.name}"
            print(f"[DB] {_db_status_msg}")
        except Exception as sqlite_err:
            _db_connected  = False
            _db_status_msg = f"Database initialization failed: {sqlite_err}"
            print(f"[DB] ERROR: {_db_status_msg}")
            return False

    # ── Create ONLY missing tables (won't alter existing ones) ────────────────
    try:
        # Create only prediction_records (safe to call even if already exists)
        PredictionRecord.__table__.create(bind=engine, checkfirst=True)
        print("[DB] prediction_records table verified/created.")

        _engine       = engine
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        _db_connected = True

        # Seed sample data if tables are empty
        with _SessionLocal() as session:
            _seed_initial_data(session)

        return True
    except Exception as err:
        _db_connected  = False
        _db_status_msg = f"Schema creation failed: {err}"
        print(f"[DB] ERROR: {_db_status_msg}")
        return False


def get_db_session() -> Optional[Session]:
    """Returns a new database session."""
    return _SessionLocal() if _SessionLocal else None


# ══════════════════════════════════════════════════════════════════════════════
# PREDICTION RECORD HANDLERS (scan audit history)
# ══════════════════════════════════════════════════════════════════════════════

def save_prediction(
    filename: str,
    oil_detected: bool,
    confidence: float,
    raw_score: float,
    file_size_bytes: Optional[int] = None,
    image_sha256: Optional[str] = None,
) -> Optional[int]:
    session = get_db_session()
    if not session:
        return None
    try:
        record = PredictionRecord(
            filename=filename,
            oil_detected=oil_detected,
            confidence=confidence,
            raw_score=raw_score,
            file_size_bytes=file_size_bytes,
            image_sha256=image_sha256,
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        return record.id
    except Exception as e:
        session.rollback()
        print(f"[DB] Failed to save prediction: {e}")
        return None
    finally:
        session.close()


def get_recent_records(limit: int = 50, filter_oil: Optional[bool] = None) -> List[Dict[str, Any]]:
    session = get_db_session()
    if not session:
        return []
    try:
        query = session.query(PredictionRecord)
        if filter_oil is not None:
            query = query.filter(PredictionRecord.oil_detected == filter_oil)
        records = query.order_by(desc(PredictionRecord.created_at)).limit(limit).all()
        return [r.to_dict() for r in records]
    except Exception as e:
        print(f"[DB] Failed to get records: {e}")
        return []
    finally:
        session.close()


def get_database_stats() -> Dict[str, Any]:
    session = get_db_session()
    if not session:
        return {"total_scans": 0, "oil_spills": 0, "clean_oceans": 0, "spill_ratio_pct": 0.0}
    try:
        total = session.query(func.count(PredictionRecord.id)).scalar() or 0
        oil   = session.query(func.count(PredictionRecord.id)).filter(PredictionRecord.oil_detected == True).scalar() or 0
        clean = total - oil
        ratio = round((oil / total * 100), 1) if total > 0 else 0.0
        return {"total_scans": total, "oil_spills": oil, "clean_oceans": clean, "spill_ratio_pct": ratio}
    except Exception:
        return {"total_scans": 0, "oil_spills": 0, "clean_oceans": 0, "spill_ratio_pct": 0.0}
    finally:
        session.close()


def clear_all_records() -> bool:
    session = get_db_session()
    if not session:
        return False
    try:
        session.query(PredictionRecord).delete()
        session.commit()
        return True
    except Exception:
        session.rollback()
        return False
    finally:
        session.close()


def get_db_status() -> Dict[str, Any]:
    db_type = "mysql" if IS_MYSQL else ("postgresql" if IS_POSTGRES else "sqlite")
    return {
        "connected":     _db_connected,
        "database_type": db_type,
        "database_name": "oil_spilling" if IS_MYSQL else ("remote" if IS_POSTGRES else "sar_oil_spill.db"),
        "status":        "online" if _db_connected else "offline",
        "message":       _db_status_msg,
        "path":          str(DB_PATH) if DB_PATH else f"Remote {db_type.upper()}",
    }
