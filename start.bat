@echo off
title Jizzax HET Monitoring

echo ================================================
echo   JIZZAX HET MONITORING TIZIMI
echo ================================================
echo.

REM Python tekshiruv
python --version >nul 2>&1
if errorlevel 1 (
    echo [XATO] Python topilmadi!
    echo        https://python.org dan yuklab ornating
    pause
    exit /b 1
)

REM Backend papkasiga otish
cd /d "%~dp0backend"

REM .env yaratish
if not exist .env (
    copy .env.example .env >nul
    echo [OK] .env yaratildi
)

REM Backend kutubxonalar
echo [1/3] Kutubxonalar tekshirilmoqda...
pip install -r requirements.txt --quiet --disable-pip-version-check
echo [OK] Kutubxonalar tayyor

REM Backend ishga tushirish
echo [2/3] Backend ishga tushirilmoqda (port 8000)...
start "Jizzax HET Backend" cmd /k "color 0A && python main.py"
cd /d "%~dp0"

REM ===== FRONTEND =====
echo [3/3] Frontend tayyorlanmoqda...

REM dist bormi?
if exist dist\index.html goto :serve_frontend

REM dist yoq - Node.js bilan quramiz
node --version >nul 2>&1
if errorlevel 1 goto :no_node

echo     node_modules tekshirilmoqda...
if not exist node_modules (
    echo     npm install bajarilmoqda (bir marta, 1-2 daqiqa)...
    call npm install --silent
)

echo     npm run build bajarilmoqda...
call npm run build
if errorlevel 1 (
    echo [XATO] Build muvaffaqiyatsiz
    goto :no_node
)

:serve_frontend
echo     Frontend server ishga tushirilmoqda (port 3000)...
start "Jizzax HET Frontend" cmd /k "color 09 && python backend\serve_frontend.py 3000"
timeout /t 3 /nobreak >nul
start http://localhost:3000
goto :done

:no_node
echo.
echo [!] Frontend server ishlamadi.
echo     Variant 1: dist\ papkasini qoyib junatilgan zip dan oling
echo     Variant 2: Node.js ornatib npm run build bajaring
echo     Variant 3: jizzax-preview.html faylini brauzerda oching
echo.

:done
echo.
echo ================================================
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   Docs:     http://localhost:8000/docs
echo   Login:    admin / Admin@2026
echo ================================================
echo.
pause
