@echo off
title Sentinel-1 SAR Oil Spill Backend Service
cd /d "%~dp0"

echo ======================================================================
echo   SENTINEL-1 SAR OIL SPILL DETECTION PLATFORM - BACKEND LAUNCHER
echo ======================================================================
echo.

IF EXIST ".venv\Scripts\python.exe" (
    set PYTHON_EXE=.venv\Scripts\python.exe
) ELSE (
    set PYTHON_EXE=python
)

echo [*] Freeing port 8000 if occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] Using Python interpreter: %PYTHON_EXE%
echo [*] Starting Sentinel-1 SAR AI Inference Service...
echo [*] API Server URL:              http://localhost:8000
echo [*] Interactive Swagger Docs:    http://localhost:8000/docs
echo [*] Web Application UI:          http://localhost:8000/ui
echo.
echo Press Ctrl+C anytime to stop the server.
echo ======================================================================
echo.

"%PYTHON_EXE%" app.py
pause
