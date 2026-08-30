@echo off
cd /d "%~dp0"
taskkill /F /IM node.exe >nul 2>&1
start /min cmd /c "npm run start"
timeout /t 3 /nobreak >nul
start http://localhost:3000