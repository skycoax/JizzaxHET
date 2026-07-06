@echo off
echo ================================================
echo  Jizzax HET Backend - Windows ga o'rnatish
echo ================================================
echo.

REM Python borligini tekshirish
python --version >nul 2>&1
if errorlevel 1 (
    echo XATO: Python topilmadi!
    echo https://python.org dan yuklab o'rnating
    pause & exit /b 1
)

REM Kutubxonalarni o'rnatish
echo [1/3] Kutubxonalar o'rnatilmoqda...
pip install -r requirements.txt --quiet
if errorlevel 1 (echo XATO: pip install muvaffaqiyatsiz & pause & exit /b 1)
echo     OK

REM .env yaratish
if not exist .env (
    echo [2/3] .env yaratilmoqda...
    copy .env.example .env >nul
    echo     OK - .env faylini oching va to'ldiring
) else (
    echo [2/3] .env mavjud - OK
)

REM Windows Task Scheduler ga qo'shish
echo [3/3] Avtomatik ishga tushirish sozlanmoqda...
set SCRIPT_DIR=%~dp0
set TASK_NAME=JizzaxHET_Backend

schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if not errorlevel 1 (
    schtasks /delete /tn "%TASK_NAME%" /f >nul
)

schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "python \"%SCRIPT_DIR%main.py\"" ^
  /sc ONSTART ^
  /ru SYSTEM ^
  /rl HIGHEST ^
  /f >nul

if errorlevel 1 (
    echo     OGOH: Task Scheduler administrator huquqi talab etadi
    echo     Qo'lda: start.bat ni ishga tushiring
) else (
    echo     OK - Kompyuter yoqilganda avtomatik ishga tushadi
)

echo.
echo ================================================
echo  O'rnatish tugadi!
echo  Ishga tushirish: start.bat
echo  Tekshirish: http://localhost:8000
echo ================================================
pause
