@echo off
title Jizzax HET - Toxtatish

echo.
echo Jizzax HET toxtatilmoqda...
echo.

for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| find ":8000 " ^| find "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
    echo [OK] Backend (port 8000) toxtatildi
)

for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| find ":3000 " ^| find "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
    echo [OK] Frontend (port 3000) toxtatildi
)

echo.
echo Tizim toxtatildi.
timeout /t 2 /nobreak >nul
