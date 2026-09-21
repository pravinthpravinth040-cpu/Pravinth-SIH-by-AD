"""
Backend App Alias pointing directly to backend.main
Ensures all ASGI references (uvicorn backend.app:app or backend.main:app) resolve identically.
"""
from backend.main import app, start

if __name__ == "__main__":
    start()
