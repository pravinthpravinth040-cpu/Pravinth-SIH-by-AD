import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directories
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load .env from project root or backend dir
env_paths = [
    PROJECT_ROOT / ".env",
    BACKEND_DIR / ".env",
    Path(".env")
]

for p in env_paths:
    if p.exists():
        load_dotenv(dotenv_path=p, override=True)
        break
else:
    load_dotenv()

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SECRET_KEY = os.getenv("SECRET_KEY", "sih-sar-oil-spill-secret-2026")
API_KEY = os.getenv("API_KEY", "")

# Database Configuration (MySQL / phpMyAdmin default)
DB_ENGINE = os.getenv("DB_ENGINE", "mysql")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "hand_off_oil")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Database Connection URL
default_db_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
DATABASE_URL = os.getenv("DATABASE_URL", default_db_url)

# Model Checkpoint Locations (searched in order)
CANDIDATE_CHECKPOINT_PATHS = [
    BACKEND_DIR / "checkpoints" / "best_model.pth",
    PROJECT_ROOT / "checkpoints" / "best_model.pth",
    PROJECT_ROOT / "model_service_handoff-20260911T055135Z-1-001" / "model_service_handoff" / "checkpoints" / "best_model.pth",
    PROJECT_ROOT / "binary classification-20260916T134200Z-1-001" / "binary classification" / "model_service_handoff" / "checkpoints" / "best_model.pth",
]

# Sample Images Search Paths
CANDIDATE_SAMPLE_DIRS = [
    BACKEND_DIR / "sample_images",
    PROJECT_ROOT / "sample_images",
    PROJECT_ROOT / "model_service_handoff-20260911T055135Z-1-001" / "model_service_handoff" / "sample_images",
    PROJECT_ROOT / "binary classification-20260916T134200Z-1-001" / "binary classification" / "model_service_handoff" / "sample_images",
]
