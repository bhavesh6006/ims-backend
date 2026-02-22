@echo off
echo ====================================
echo IMS-Backend Service Uninstaller
echo ====================================
echo.

set SERVICE_NAME=IMS-Backend

where nssm >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%~dp0nssm.exe" (
        set NSSM=%~dp0nssm.exe
    ) else (
        echo ERROR: nssm.exe not found.
        pause
        exit /b 1
    )
) else (
    set NSSM=nssm
)

echo Stopping service...
%NSSM% stop %SERVICE_NAME% >nul 2>&1
timeout /t 3 /nobreak >nul

echo Removing service...
%NSSM% remove %SERVICE_NAME% confirm >nul 2>&1
timeout /t 2 /nobreak >nul

echo Service removed successfully!
echo.
pause
