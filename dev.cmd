@echo off
rem Start the game locally and open it in the default browser.
rem Double-click this file, or run "dev.cmd" in a terminal. Extra arguments go to Vite,
rem e.g. "dev.cmd --host" to also test from an iPad on the same Wi-Fi.
setlocal
cd /d "%~dp0"

rem The game needs Node 20+. If the machine's default Node is older, borrow a newer one
rem installed through nvm-windows for this window only; the default Node is left untouched.
set "MAJOR=0"
for /f "tokens=1 delims=." %%v in ('node -v 2^>nul') do set "MAJOR=%%v"
set "MAJOR=%MAJOR:v=%"
if %MAJOR% GEQ 20 goto run

if not defined NVM_HOME goto missing
set "NODE_DIR="
for /f "delims=" %%d in ('dir /b /ad /o:n "%NVM_HOME%\v2*" 2^>nul') do set "NODE_DIR=%NVM_HOME%\%%d"
if not defined NODE_DIR goto missing
set "PATH=%NODE_DIR%;%PATH%"

:run
if not exist node_modules call npm install
call npm run dev -- --open %*
goto :eof

:missing
echo This game needs Node 20 or newer, but none was found.
echo Install one with:  nvm install lts
pause
exit /b 1
