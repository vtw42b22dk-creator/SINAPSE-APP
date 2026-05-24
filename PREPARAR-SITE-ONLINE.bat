@echo off
title Sinapse - preparar pasta para publicar
cd /d "%~dp0"
echo.
echo  A criar pasta "site-pronto" com o site compilado...
echo.
if not exist "node_modules\" (
  echo  A instalar dependencias...
  call npm install
)
set VITE_BASE_PATH=/
call npm run build
if errorlevel 1 (
  echo.
  echo  ERRO no build. Verifica se tens Node.js instalado.
  pause
  exit /b 1
)
if exist "site-pronto" rmdir /s /q "site-pronto"
mkdir "site-pronto"
xcopy /e /i /y "dist\*" "site-pronto\"
copy /y "dist\index.html" "site-pronto\404.html" >nul
powershell -Command "Compress-Archive -Path 'site-pronto\*' -DestinationPath 'site-pronto-upload.zip' -Force"
echo.
echo  PRONTO!
echo  Pasta: %cd%\site-pronto
echo  ZIP:   %cd%\site-pronto-upload.zip
echo.
echo  Cloudflare: arrasta a pasta site-pronto (ou o ZIP)
echo  Netlify:    app.netlify.com/drop (se a conta nao estiver pausada)
echo.
explorer "%cd%\site-pronto"
pause
