@echo off
TITLE DocuVault - Standalone Offline Server
echo ========================================================
echo   DocuVault Enterprise File Versioning (Offline Mode)
echo ========================================================
echo.
echo [1/3] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (version 18 or newer) from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [2/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing local offline packages...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo [3/3] Starting DocuVault Standalone Engine...
echo Server starting at http://localhost:3000
echo.
echo (Press Ctrl+C to stop the server)
echo.

start http://localhost:3000

call npm run dev

pause
