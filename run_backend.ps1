# Sentinel-1 SAR Oil Spill Backend Service - PowerShell Launcher
$Host.UI.RawUI.WindowTitle = "Sentinel-1 SAR Oil Spill Backend Service"
Set-Location -Path $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  SENTINEL-1 SAR OIL SPILL DETECTION PLATFORM - BACKEND LAUNCHER" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$PythonExe = "python"
if (Test-Path ".\.venv\Scripts\python.exe") {
    $PythonExe = ".\.venv\Scripts\python.exe"
}

Write-Host "[*] Using Python interpreter: $PythonExe" -ForegroundColor Green
Write-Host "[*] Server endpoint:          http://localhost:8000" -ForegroundColor Green
Write-Host "[*] Interactive API Docs:     http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "[*] Web Application UI:       http://localhost:8000/ui" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the service." -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

& $PythonExe app.py
