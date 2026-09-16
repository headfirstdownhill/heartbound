@echo off
setlocal
cd /d "%~dp0"

echo.
echo   ==========================================
echo     ADD A LETTER
echo   ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 goto nonode

node tools\drop-server.js
if errorlevel 1 goto failed
goto end

:nonode
echo   PROBLEM: Node is not installed on this computer.
echo.
echo   Get it free from  https://nodejs.org  - the big green button.
echo   Install it, restart the computer, then try again.
echo.
pause
goto end

:failed
echo.
echo   It stopped unexpectedly. The message above says why.
echo.
echo   If it says the address is already in use, this is already running in
echo   another window - use that one, or close it and try again.
echo.
echo   You can always fall back to ADD-LETTER.bat and PUBLISH.bat instead.
echo.
pause

:end
