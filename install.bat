@echo off
title Jizzax HET - Ornatish

echo ================================================
echo   JIZZAX HET - Birinchi marta ornatish
echo ================================================
echo.

REM Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [XATO] Python topilmadi!
    echo        https://python.org dan yuklab ornating
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo [OK] %%v

REM Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [XATO] Node.js topilmadi!
    echo        https://nodejs.org dan yuklab ornating
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo [OK] Node.js %%v

echo.
echo [1/4] Backend kutubxonalar o'rnatilmoqda...
cd /d "%~dp0backend"
pip install -r requirements.txt --quiet --disable-pip-version-check
if errorlevel 1 (
    echo [XATO] pip install muvaffaqiyatsiz
    pause & exit /b 1
)
echo [OK] Backend kutubxonalar tayyor

echo.
echo [2/4] .env fayli yaratilmoqda...
if not exist .env (
    copy .env.example .env >nul
    echo [OK] .env yaratildi
    echo.
    echo      Keyin backend\.env faylini oching va:
    echo      - CASNET_URL=http://web.cas.het
    echo      - CASNET_USER=login
    echo      - CASNET_PASS=parol
    echo      ni kiriting
) else (
    echo [OK] .env mavjud
)

echo.
echo [3/4] Frontend paketlar o'rnatilmoqda...
cd /d "%~dp0"
call npm install --silent
if errorlevel 1 (
    echo [XATO] npm install muvaffaqiyatsiz
    pause & exit /b 1
)
echo [OK] node_modules tayyor

echo.
echo [4/4] Frontend qurilmoqda...
call npm run build
if errorlevel 1 (
    echo [XATO] npm run build muvaffaqiyatsiz
    pause & exit /b 1
)
echo [OK] dist\ papkasi tayyor

echo.
echo ================================================
echo   Ornatish tugadi!
echo   Endi: start.bat ni ishga tushiring
echo ================================================
echo.
pause
