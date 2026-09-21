import os
from pathlib import Path
from dotenv import load_dotenv

# ── Directory layout ───────────────────────────────────────────────────────────
BACKEND_DIR  = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load .env (project root preferred, then backend dir)
for _p in [PROJECT_ROOT / ".env", BACKEND_DIR / ".env", Path(".env")]:
    if _p.exists():
        load_dotenv(dotenv_path=_p, override=True)
        break
else:
    load_dotenv()

# ── Server ─────────────────────────────────────────────────────────────────────
HOST        = os.getenv("HOST", "0.0.0.0")
PORT        = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SECRET_KEY  = os.getenv("SECRET_KEY", "spillwatch-secret-2026")
API_KEY     = os.getenv("API_KEY", "")

# ── CORS ───────────────────────────────────────────────────────────────────────
CORS_ORIGINS_RAW = os.getenv("CORS_ORIGINS", "")
DEFAULT_CORS_ORIGINS = [
    "https://pravinthpravinth040-cpu.github.io",
    "http://localhost:8000",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5500",
]
if CORS_ORIGINS_RAW:
    ALLOWED_ORIGINS = [o.strip() for o in CORS_ORIGINS_RAW.split(",") if o.strip()]
else:
    # In development allow everything; production tightens via env var
    ALLOWED_ORIGINS = DEFAULT_CORS_ORIGINS + (["*"] if ENVIRONMENT != "production" else [])

# ── Copernicus Data Space (Sentinel-1 SAR) ─────────────────────────────────────
# Register free at https://dataspace.copernicus.eu
CDSE_CLIENT_ID     = os.getenv("CDSE_CLIENT_ID", "")
CDSE_CLIENT_SECRET = os.getenv("CDSE_CLIENT_SECRET", "")
CDSE_TOKEN_URL     = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CDSE_STAC_API_URL  = "https://catalogue.dataspace.copernicus.eu/stac"   # public, no auth for search
CDSE_OData_URL     = "https://catalogue.dataspace.copernicus.eu/odata/v1"

# ── AIS Data Provider ──────────────────────────────────────────────────────────
# Register free at https://aisstream.io
AIS_API_KEY          = os.getenv("AIS_API_KEY", "")
AIS_PROVIDER         = os.getenv("AIS_PROVIDER", "aisstream")          # "aisstream" | "marine_traffic"
AISSTREAM_API_URL    = "https://api.aisstream.io/v0"
MARINE_TRAFFIC_URL   = "https://services.marinetraffic.com/api"

# ── Database ───────────────────────────────────────────────────────────────────
DB_ENGINE    = os.getenv("DB_ENGINE", "sqlite")
DB_HOST      = os.getenv("DB_HOST", "localhost")
DB_PORT      = int(os.getenv("DB_PORT", "5432"))
DB_NAME      = os.getenv("DB_NAME", "spillwatch")
DB_USER      = os.getenv("DB_USER", "postgres")
DB_PASSWORD  = os.getenv("DB_PASSWORD", "")

# SQLite path (used when DATABASE_URL is not set or DB_ENGINE=sqlite)
SQLITE_PATH  = PROJECT_ROOT / "sar_oil_spill.db"
_default_db  = f"sqlite:///{SQLITE_PATH.as_posix()}"
DATABASE_URL = os.getenv("DATABASE_URL", _default_db)

# ── Model checkpoints ──────────────────────────────────────────────────────────
CANDIDATE_CHECKPOINT_PATHS = [
    BACKEND_DIR  / "checkpoints" / "best_model.pth",
    PROJECT_ROOT / "checkpoints" / "best_model.pth",
    PROJECT_ROOT / "model_service_handoff-20260911T055135Z-1-001"
               / "model_service_handoff" / "checkpoints" / "best_model.pth",
    PROJECT_ROOT / "binary classification-20260916T134200Z-1-001"
               / "binary classification" / "model_service_handoff"
               / "checkpoints" / "best_model.pth",
]

# ── Sample images ──────────────────────────────────────────────────────────────
CANDIDATE_SAMPLE_DIRS = [
    BACKEND_DIR  / "sample_images",
    PROJECT_ROOT / "sample_images",
    PROJECT_ROOT / "model_service_handoff-20260911T055135Z-1-001"
               / "model_service_handoff" / "sample_images",
    PROJECT_ROOT / "binary classification-20260916T134200Z-1-001"
               / "binary classification" / "model_service_handoff" / "sample_images",
]

# ── Request timeouts (seconds) ─────────────────────────────────────────────────
SAR_TIMEOUT  = int(os.getenv("SAR_TIMEOUT",  "15"))
AIS_TIMEOUT  = int(os.getenv("AIS_TIMEOUT",  "10"))
HTTP_TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "12"))
