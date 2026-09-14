@echo off
setlocal
cd /d "%~dp0"

echo.
echo   ==========================================
echo     PUTTING YOUR LETTERS INTO THE GAME
echo   ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 goto nonode

node tools\add-letter.js
if errorlevel 1 goto stopped

echo   Rebuilding the game...
echo.
powershell -ExecutionPolicy Bypass -File build.ps1
if errorlevel 1 goto buildfailed

echo.
echo   ------------------------------------------
echo     ALL DONE.
echo   ------------------------------------------
echo.
echo   Next: double-click  heartbound.html  and read it through
echo   to check it looks right.
echo.
echo   Then, when you are happy with it, double-click  PUBLISH.bat
echo   to put it online.
echo.
goto end

:nonode
echo   PROBLEM: Node is not installed on this computer.
echo.
echo   This needs it. Get it free from  https://nodejs.org
echo   Pick the big green button, install it, restart the computer,
echo   then run this again.
echo.
goto end

:stopped
echo.
echo   Nothing was changed. The game is exactly as it was.
echo.
echo   Read the message above - it says what needs fixing. If it does
echo   not make sense, LETTERS.md has a section called
echo   "When it tells you something is wrong".
echo.
goto end

:buildfailed
echo.
echo   PROBLEM: your letters were saved, but rebuilding the game failed.
echo.
echo   The message above says why. The website version is still fine;
echo   it is the double-click  heartbound.html  copy that did not update.
echo.
goto end

:end
pause
