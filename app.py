"""
Sentinel-1 SAR Oil Spill Classification Platform
Root Backend Application Entry Point
"""
import os
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Expose app for ASGI servers (uvicorn app:app)
from backend.app import app, start
from backend.config import HOST, PORT

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    print("=" * 65)
    print("  SENTINEL-1 SAR OIL SPILL DETECTION SERVICE")
    print(f"  Starting API server on http://{host}:{port}")
    print(f"  Interactive API Docs: http://localhost:{port}/docs")
    print(f"  Integrated UI:        http://localhost:{port}/ui")
    print("=" * 65)
    import uvicorn
    uvicorn.run(app, host=host, port=port)
