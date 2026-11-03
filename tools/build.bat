@echo off
rem Dupli klik pokrece build.ps1 (pravi stranice proizvoda i azurira header/footer na svim stranicama)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1"
echo.
pause
