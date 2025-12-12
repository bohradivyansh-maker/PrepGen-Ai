# PrepGen Frontend Startup Script
# Run this from the project root directory

Write-Host "Starting PrepGen Frontend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend Server: http://127.0.0.1:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Make sure the backend is running at http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host ""

python -m http.server 8080
