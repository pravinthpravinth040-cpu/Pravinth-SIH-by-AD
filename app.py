"""
Sentinel-1 SAR Oil Spill Classification Platform
Root Backend Application Entry Point
"""
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app import app, start
from backend.config import HOST, PORT

if __name__ == "__main__":
    print("=" * 65)
    print("  SENTINEL-1 SAR OIL SPILL DETECTION SERVICE")
    print(f"  Starting API server on http://{HOST}:{PORT}")
    print(f"  Interactive API Docs: http://localhost:{PORT}/docs")
    print(f"  Integrated UI:        http://localhost:{PORT}/ui")
    print("=" * 65)
    start()
