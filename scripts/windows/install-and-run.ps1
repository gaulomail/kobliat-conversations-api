# Kobliat Install and Run (Windows PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "Starting Installation..."
.\scripts\windows\setup-local.ps1

Write-Host "Starting Services..."
.\scripts\windows\start-all.bat
