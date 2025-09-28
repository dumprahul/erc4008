@echo off
REM install.bat - Quick installation script for 0g-agent-cli

echo ================================
echo  0G Agent CLI Installation
echo ================================
echo.

echo [1/3] Installing CLI dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Looking for 0g-agent-kit...

REM Try to install from local directory first
if exist "..\0g-agent-kit" (
    echo Found local 0g-agent-kit directory
    echo Installing from file:../0g-agent-kit...
    call npm install file:../0g-agent-kit
    if %errorlevel% equ 0 (
        echo SUCCESS: 0g-agent-kit installed from local directory
        goto :success
    )
)

REM Try copying manually
if exist "..\0g-agent-kit" (
    echo Trying manual copy method...
    if not exist "node_modules" mkdir node_modules
    xcopy "..\0g-agent-kit" "node_modules\0g-agent-kit\" /E /I /Y
    if %errorlevel% equ 0 (
        echo SUCCESS: 0g-agent-kit copied manually
        goto :success
    )
)

echo ERROR: Could not install 0g-agent-kit
echo Please ensure 0g-agent-kit is in the parent directory
echo Or install manually: npm install file:../0g-agent-kit
pause
exit /b 1

:success
echo.
echo [3/3] Installation complete!
echo.
echo ================================
echo  Ready to run 0G Agent CLI
echo ================================
echo.
echo To start the CLI, run:
echo   npm start
echo.
echo Or:
echo   node src/cli.js
echo.
pause