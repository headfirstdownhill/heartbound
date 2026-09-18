@echo off
setlocal
cd /d "%~dp0"

echo.
echo   ==========================================
echo     PUTTING THE GAME ONLINE
echo   ==========================================
echo.

where git >nul 2>nul
if errorlevel 1 goto nogit
where node >nul 2>nul
if errorlevel 1 goto nonode

rem The site reads letters.json and copies it over the built-in letters, so a
rem stale one would remove a letter rather than add it. Regenerating both is the
rem check: if anything is wrong it says so and stops.
node tools\add-letter.js --verify >nul
if errorlevel 1 goto outofstep

rem Anything at all, including files git has never seen before - a brand new
rem letter is one of those, and a check for changed-tracked-files only would
rem call that "nothing to publish".
set "DIRTY="
for /f "delims=" %%s in ('git status --porcelain -uall') do set "DIRTY=1"
if defined DIRTY goto review

rem Nothing new, but a publish whose push failed last time leaves its commit
rem here and a clean folder behind. That still has to go out.
set "AHEAD=0"
for /f "delims=" %%n in ('node tools\add-letter.js --unpushed') do set "AHEAD=%%n"
if "%AHEAD%"=="0" goto nothing
echo   Last time, the letters were saved on this computer but never reached
echo   the website. Sending them now.
goto push

:review

echo   These are the things that have changed and are about to go online:
echo.
git status --short -uall
echo.
echo   The website is public, so anything here can be read by anyone
echo   who finds it. That is already true of what is up there now.
echo.
echo   ------------------------------------------
set "GO="
set /p "GO=  Type  yes  and press Enter to publish:  "
if /i not "%GO%"=="yes" goto cancelled

for /f "delims=" %%m in ('node tools\add-letter.js --message') do set "MSG=%%m"
if not defined MSG set "MSG=The letters"

echo.
echo   Saving as: %MSG%
rem Everything that was listed above, which is what she just said yes to.
rem Naming a handful of paths instead would quietly leave things behind - the
rem first publish also has to carry the tools and the guide, not just a letter.
git add -A
if errorlevel 1 goto failed

git commit -m "%MSG%"
if errorlevel 1 goto failed

:push
echo.
echo   Sending it to the website...
git push
if errorlevel 1 goto pushfailed

echo.
echo   ------------------------------------------
echo     PUBLISHED.
echo   ------------------------------------------
echo.
echo   Give it about a minute, then look at:
echo   https://headfirstdownhill.github.io/heartbound/
echo.
echo   If the page looks the same at first, that is normal - your
echo   phone or browser is showing you the old copy. Pull down to
echo   refresh it, or wait a few minutes.
echo.
goto end

:outofstep
echo   PROBLEM: the letters are not in step, so nothing was published.
echo.
node tools\add-letter.js --verify
echo.
goto end

:cancelled
echo.
echo   Cancelled. Nothing has gone online.
echo.
goto end

:nothing
echo   Nothing has changed since last time, so there is nothing to publish.
echo.
echo   If you meant to add a letter, run  ADD-LETTER.bat  first.
echo.
goto end

:nogit
echo   PROBLEM: Git is not installed on this computer.
echo.
echo   Get it free from  https://git-scm.com  - click through the
echo   installer leaving everything as it is, restart the computer,
echo   then run this again.
echo.
goto end

:nonode
echo   PROBLEM: Node is not installed on this computer.
echo   Get it free from  https://nodejs.org
echo.
goto end

:failed
echo.
echo   PROBLEM: something went wrong saving the change. The message
echo   above says what. Nothing has gone online.
echo.
goto end

:pushfailed
echo.
echo   PROBLEM: the change was saved on this computer but could not be
echo   sent to the website.
echo.
echo   Usually this is either no internet, or GitHub asking who you are.
echo   Check the connection and run this again - it will pick up where
echo   it left off, and it is safe to run twice.
echo.
goto end

:end
pause
