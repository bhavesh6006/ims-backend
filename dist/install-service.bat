@echo off
setlocal EnableDelayedExpansion

echo ====================================
echo IMS-Backend Service Installer
echo ====================================

:: Check for admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run as Administrator!
    pause
    exit /b 1
)

set SERVICE_NAME=IMS-Backend
set CURRENT_DIR=%~dp0
set CURRENT_DIR=%CURRENT_DIR:~0,-1%
set NSSM=%CURRENT_DIR%\nssm.exe
set EXE=%CURRENT_DIR%\ims-backend.exe
set ENV_SOURCE=%CURRENT_DIR%\..\.env
set ENV_DEST=%CURRENT_DIR%\.env

echo Using NSSM: %NSSM%
echo EXE Path: %EXE%
echo Working Dir: %CURRENT_DIR%

:: Verify exe exists
if not exist "%EXE%" (
    echo ERROR: %EXE% not found!
    pause
    exit /b 1
)

:: Copy .env file to dist folder if not already there
if not exist "%ENV_DEST%" (
    if exist "%ENV_SOURCE%" (
        echo Copying .env file to dist folder...
        copy "%ENV_SOURCE%" "%ENV_DEST%" >nul
        echo .env copied successfully.
    ) else (
        echo WARNING: No .env file found at %ENV_SOURCE%
        echo Please create a .env file in %CURRENT_DIR%
    )
) else (
    echo .env file already exists in dist folder.
)

:: Kill any running instance to free port
echo.
echo Killing any existing ims-backend.exe processes...
taskkill /f /im ims-backend.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Remove existing service if present
echo Removing existing service (if any)...
"%NSSM%" stop %SERVICE_NAME% >nul 2>&1
timeout /t 3 /nobreak >nul
"%NSSM%" remove %SERVICE_NAME% confirm >nul 2>&1
timeout /t 2 /nobreak >nul

:: Install service
echo.
echo Installing service...
"%NSSM%" install %SERVICE_NAME% "%EXE%"
if %errorLevel% neq 0 (
    echo ERROR: Failed to install service!
    pause
    exit /b 1
)

:: Set service parameters
"%NSSM%" set %SERVICE_NAME% AppDirectory "%CURRENT_DIR%"
"%NSSM%" set %SERVICE_NAME% DisplayName "IMS Backend Service"
"%NSSM%" set %SERVICE_NAME% Description "Inventory Management System Backend"
"%NSSM%" set %SERVICE_NAME% Start SERVICE_AUTO_START

:: Set environment variables
"%NSSM%" set %SERVICE_NAME% AppEnvironmentExtra NODE_ENV=production

:: Log settings - create logs dir first
if not exist "%CURRENT_DIR%\logs" mkdir "%CURRENT_DIR%\logs"
"%NSSM%" set %SERVICE_NAME% AppStdout "%CURRENT_DIR%\logs\service-stdout.log"
"%NSSM%" set %SERVICE_NAME% AppStderr "%CURRENT_DIR%\logs\service-stderr.log"
"%NSSM%" set %SERVICE_NAME% AppRotateFiles 1
"%NSSM%" set %SERVICE_NAME% AppRotateOnline 1
"%NSSM%" set %SERVICE_NAME% AppRotateBytes 5000000

:: Restart settings
"%NSSM%" set %SERVICE_NAME% AppRestartDelay 5000
"%NSSM%" set %SERVICE_NAME% AppThrottle 10000
"%NSSM%" set %SERVICE_NAME% AppExit Default Restart

:: Make sure port 3000 is free
echo.
echo Checking if port 3000 is free...
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorLevel% equ 0 (
    echo WARNING: Port 3000 is in use! Trying to free it...
    for /f "tokens=5" %%P in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        taskkill /f /pid %%P >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

:: Start service
echo.
echo Starting service...
"%NSSM%" start %SERVICE_NAME%

:: Wait and retry status check
echo Waiting for service to start...
set STARTED=0
for /L %%i in (1,1,10) do (
    if !STARTED! equ 0 (
        timeout /t 2 /nobreak >nul
        for /f "tokens=*" %%S in ('"%NSSM%" status %SERVICE_NAME% 2^>nul') do (
            if "%%S"=="SERVICE_RUNNING" (
                set STARTED=1
            )
        )
    )
)

if !STARTED! equ 1 (
    echo.
    echo ====================================
    echo Service started SUCCESSFULLY!
    echo.
    echo   Status:  RUNNING
    echo   Port:    3000
    echo   Logs:    %CURRENT_DIR%\logs\
    echo.
    echo   Test it: curl http://localhost:3000
    echo ====================================
) else (
    :: One more check - maybe it's running but status was weird
    netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
    if !errorLevel! equ 0 (
        echo.
        echo ====================================
        echo Service is RUNNING! ^(port 3000 is active^)
        echo.
        echo   Logs: %CURRENT_DIR%\logs\
        echo   Test: curl http://localhost:3000
        echo ====================================
    ) else (
        echo.
        echo ====================================
        echo Service may have FAILED to start.
        echo ====================================
        echo.
        if exist "%CURRENT_DIR%\logs\service-stderr.log" (
            echo === service-stderr.log ===
            type "%CURRENT_DIR%\logs\service-stderr.log"
            echo.
        )
        if exist "%CURRENT_DIR%\logs\service-stdout.log" (
            echo === service-stdout.log ===
            type "%CURRENT_DIR%\logs\service-stdout.log"
            echo.
        )
        echo.
        echo TROUBLESHOOTING:
        echo 1. Check: "%NSSM%" status %SERVICE_NAME%
        echo 2. Try:   cd /d %CURRENT_DIR% ^&^& ims-backend.exe
        echo 3. Check PostgreSQL is running
        echo 4. Check port: netstat -ano ^| findstr :3000
        echo ====================================
    )
)

echo.
pause
