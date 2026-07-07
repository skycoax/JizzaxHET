@echo off
chcp 65001 >nul
title Jizzax HET — DEV launcher
setlocal enabledelayedexpansion

echo ================================================
echo   JIZZAX HET — DEV rejim (hot-reload)
echo   Backend: 8000   Frontend: 5173
echo ================================================
echo.

REM ── 1. Python va Node tekshiruv ─────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [XATO] Python topilmadi! https://python.org
    pause & exit /b 1
)
node --version >nul 2>&1
if errorlevel 1 (
    echo [XATO] Node.js topilmadi! https://nodejs.org
    pause & exit /b 1
)

REM ── 2. Band portlarni bo'shatish (8000 va 5173) ──
echo [1/4] Portlar bo'shatilmoqda (8000, 5173)...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| find ":8000 " ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| find ":5173 " ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1

REM ── 3. Backend: .env + kutubxonalar ─────────────
cd /d "%~dp0backend"
if not exist .env (
    copy .env.example .env >nul
    echo [OK] backend\.env yaratildi
)
echo [2/4] Backend kutubxonalari tekshirilmoqda...
python -c "import fastapi, uvicorn, multipart, jose, passlib, bcrypt, httpx, dotenv" >nul 2>&1
if errorlevel 1 (
    echo     Kutubxonalar o'rnatilmoqda (bir marta)...
    pip install -r requirements.txt --quiet --disable-pip-version-check
)
echo [OK] Backend tayyor

REM ── 4. Frontend: node_modules ───────────────────
cd /d "%~dp0"
echo [3/4] Frontend paketlari tekshirilmoqda...
if not exist node_modules (
    echo     npm install bajarilmoqda (bir marta, 1-2 daqiqa)...
    call npm install
)
echo [OK] Frontend tayyor

REM ── 5. Ikkala serverni alohida oynada ishga tushirish
echo [4/4] Serverlar ishga tushirilmoqda...
start "Jizzax HET Backend  (8000)"  cmd /k "color 0A && cd /d "%~dp0backend" && python main.py"
start "Jizzax HET Frontend (5173)"  cmd /k "color 09 && cd /d "%~dp0" && npm run dev"

REM Brauzer — vite ko'tarilishini kutamiz
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ================================================
echo   Frontend: http://localhost:5173   (shu ochiladi)
echo   Backend:  http://localhost:8000
echo   API docs: http://localhost:8000/docs
echo   Login:    admin / Admin@2026
echo.
echo   To'xtatish: stop.bat  (yoki oynalarni yopish)
echo ================================================
echo.
echo Bu oynani yopsangiz — serverlar ishlashda davom etadi.
pause
