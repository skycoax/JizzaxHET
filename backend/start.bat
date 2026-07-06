@echo off
title Jizzax HET Backend

echo ================================================
echo   Jizzax HET Backend - port 8000
echo ================================================
echo.

cd /d "%~dp0"

if not exist .env (
    copy .env.example .env >nul
    echo [OK] .env yaratildi
)

echo Kutubxonalar tekshirilmoqda...
pip install -r requirements.txt --quiet --disable-pip-version-check
echo Server ishga tushmoqda...
echo.

python main.py

echo.
echo Server toxtatildi.
pause
