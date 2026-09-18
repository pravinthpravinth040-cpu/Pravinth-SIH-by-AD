import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, desc, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from backend.config import (
    DATABASE_URL,
    DB_ENGINE,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    PROJECT_ROOT
)

Base = declarative_base()

class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    oil_detected = Column(Boolean, nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    raw_score = Column(Float, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    image_sha256 = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self) -> Dict[str, Any]:
        is_oil = bool(self.oil_detected)
        ts = self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        return {
            "id": self.id,
            "filename": self.filename,
            "classification": "OIL SPILL" if is_oil else "CLEAN OCEAN",
            "is_oil_spill": is_oil,
            "oil_detected": is_oil,
            "confidence": round(float(self.confidence), 4),
            "raw_score": round(float(self.raw_score), 4),
            "raw_probability": round(float(self.raw_score), 4),
            "threshold": 0.50,
            "model": "PyTorch ResNet / ConvNet",
            "file_size_bytes": self.file_size_bytes,
            "image_sha256": self.image_sha256,
            "timestamp": ts,
            "created_at": ts
        }

# Global DB state
_engine = None
_SessionLocal = None
_db_connected = False
_db_status_message = "Uninitialized"
_fallback_mode = False

def init_db():
    """Initializes MySQL database connection or falls back to local SQLite if MySQL is unavailable."""
    global _engine, _SessionLocal, _db_connected, _db_status_message, _fallback_mode

    # Attempt Primary MySQL connection
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_recycle=3600,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 5}
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        Base.metadata.create_all(bind=engine)
        _engine = engine
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
        _db_connected = True
        _fallback_mode = False
        _db_status_message = f"Connected to MySQL [{DB_HOST}:{DB_PORT}/{DB_NAME}]"
        print(f"[Backend Database] Successfully {_db_status_message}")
        return True
    except Exception as mysql_err:
        print(f"[Backend Database] MySQL connection failed ({mysql_err}). Falling back to local SQLite audit log.")

    # Attempt SQLite Fallback
    try:
        sqlite_path = PROJECT_ROOT / "sar_audit_fallback.db"
        sqlite_url = f"sqlite:///{sqlite_path.as_posix()}"
        fallback_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=fallback_engine)
        _engine = fallback_engine
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
        _db_connected = True
        _fallback_mode = True
        _db_status_message = f"Operating on local SQLite fallback ({sqlite_path.name})"
        print(f"[Backend Database] {_db_status_message}")
        return True
    except Exception as sqlite_err:
        _db_connected = False
        _fallback_mode = False
        _db_status_message = f"Database offline: {sqlite_err}"
        print(f"[Backend Database] Error: {_db_status_message}")
        return False

def get_db_session() -> Optional[Session]:
    if _SessionLocal:
        return _SessionLocal()
    return None

def save_prediction(
    filename: str,
    oil_detected: bool,
    confidence: float,
    raw_score: float,
    file_size_bytes: Optional[int] = None,
    image_sha256: Optional[str] = None
) -> Optional[int]:
    """Saves a single prediction result into prediction_records table."""
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
            created_at=datetime.utcnow()
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        return record.id
    except Exception as err:
        session.rollback()
        print(f"[Backend Database] Failed to insert record: {err}")
        return None
    finally:
        session.close()

def get_recent_records(limit: int = 50, filter_oil: Optional[bool] = None) -> List[Dict[str, Any]]:
    """Retrieves recent prediction history ordered newest first."""
    session = get_db_session()
    if not session:
        return []

    try:
        query = session.query(PredictionRecord)
        if filter_oil is not None:
            query = query.filter(PredictionRecord.oil_detected == filter_oil)
        records = query.order_by(desc(PredictionRecord.created_at)).limit(limit).all()
        return [r.to_dict() for r in records]
    except Exception as err:
        print(f"[Backend Database] Failed to fetch history: {err}")
        return []
    finally:
        session.close()

def get_database_stats() -> Dict[str, Any]:
    """Calculates aggregate statistics from the database."""
    session = get_db_session()
    if not session:
        return {"total_scans": 0, "oil_spills": 0, "clean_oceans": 0, "avg_confidence": 0.0}

    try:
        total = session.query(PredictionRecord).count()
        oil_count = session.query(PredictionRecord).filter(PredictionRecord.oil_detected == True).count()
        clean_count = total - oil_count

        from sqlalchemy import func
        avg_conf = session.query(func.avg(PredictionRecord.confidence)).scalar() or 0.0

        return {
            "total_scans": total,
            "oil_spills": oil_count,
            "clean_oceans": clean_count,
            "avg_confidence": round(float(avg_conf), 4),
            "db_mode": "fallback_sqlite" if _fallback_mode else "mysql_active"
        }
    except Exception as err:
        print(f"[Backend Database] Failed to calculate stats: {err}")
        return {"total_scans": 0, "oil_spills": 0, "clean_oceans": 0, "avg_confidence": 0.0}
    finally:
        session.close()

def clear_all_records() -> bool:
    """Clears history in prediction_records."""
    session = get_db_session()
    if not session:
        return False
    try:
        session.query(PredictionRecord).delete()
        session.commit()
        return True
    except Exception as err:
        session.rollback()
        print(f"[Backend Database] Failed to clear records: {err}")
        return False
    finally:
        session.close()

def get_db_status() -> Dict[str, Any]:
    return {
        "connected": _db_connected,
        "is_fallback": _fallback_mode,
        "engine": "sqlite" if _fallback_mode else DB_ENGINE,
        "host": DB_HOST if not _fallback_mode else "local",
        "database": DB_NAME if not _fallback_mode else "sar_audit_fallback.db",
        "message": _db_status_message
    }
