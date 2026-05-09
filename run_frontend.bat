@echo off
echo ========================================
echo Installing FinSight Frontend Packages...
echo ========================================
call npm install

echo.
echo ========================================
echo Starting FinSight Frontend Server...
echo ========================================
call npm run dev
