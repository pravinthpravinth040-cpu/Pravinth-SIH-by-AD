"""
Sentinel-1 SAR Oil Spill Classification Platform
Root Backend Application Entry Point (uvicorn app:app)
"""
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.main import app, start

if __name__ == "__main__":
    start()
