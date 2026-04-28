@echo off
TITLE Secure Vault Launcher
echo ==========================================
echo Starting Application Servers
echo ==========================================

echo Starting Backend API (Port 5001)...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Starting Frontend UI...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Both servers are launching in separate windows!
echo Once they are ready, access the UI at http://localhost:5176
echo.
pause
