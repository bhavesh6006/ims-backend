@echo off
REM ===================================================================
REM Log Cleanup - 30 Day Retention
REM ===================================================================
REM NSSM rotated files use the pattern:
REM   service-stdout-YYYYMMDDTHHMMSS.log
REM   service-stderr-YYYYMMDDTHHMMSS.log
REM This script deletes rotated logs older than 30 days.
REM ===================================================================

set LOG_DIR=%~dp0logs
set RETENTION_DAYS=30

if not exist "%LOG_DIR%" (
    echo No logs directory found at %LOG_DIR%
    exit /b 0
)

echo [%date% %time%] Starting log cleanup (retention: %RETENTION_DAYS% days) >> "%LOG_DIR%\cleanup.log"

REM Delete rotated stdout logs older than 30 days
forfiles /p "%LOG_DIR%" /m "service-stdout-*.log" /d -%RETENTION_DAYS% /c "cmd /c echo Deleting @file >> \"%LOG_DIR%\cleanup.log\" && del /q @path" 2>nul

REM Delete rotated stderr logs older than 30 days
forfiles /p "%LOG_DIR%" /m "service-stderr-*.log" /d -%RETENTION_DAYS% /c "cmd /c echo Deleting @file >> \"%LOG_DIR%\cleanup.log\" && del /q @path" 2>nul

REM Keep cleanup.log itself trimmed (delete if older than 90 days)
forfiles /p "%LOG_DIR%" /m "cleanup.log" /d -90 /c "cmd /c del /q @path" 2>nul

echo [%date% %time%] Cleanup completed >> "%LOG_DIR%\cleanup.log"
