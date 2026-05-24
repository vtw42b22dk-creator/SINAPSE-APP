@echo off
title Sinapse - servidor local
cd /d "%~dp0"
echo.
echo  Sinapse - a abrir no browser...
echo  Se fechares esta janela, a app para.
echo.
if not exist "node_modules\" (
  echo  A instalar dependencias (primeira vez, 1-2 min)...
  call npm install
)
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"
call npm run dev
pause
