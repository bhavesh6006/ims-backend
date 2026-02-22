====================================
IMS Backend - Installation Guide
====================================

PREREQUISITES:
- Windows Server 2016 or later
- PostgreSQL / SQL Server database set up
- LDAP server accessible from this machine
- nssm.exe (included or download from https://nssm.cc)

FILES:
- ims-backend.exe      : Application executable
- nssm.exe             : Windows service manager
- .env.example         : Configuration template
- install-service.bat  : Service installer (run as Admin)
- uninstall-service.bat: Service uninstaller (run as Admin)

INSTALLATION STEPS:

1. Copy all files to a permanent directory, e.g.:
   C:\IMS-Backend\

2. Copy .env.example to .env:
   copy .env.example .env

3. Edit .env with your actual configuration:
   - Database connection details
   - LDAP server details
   - JWT secret (use a long random string)
   - Port number

4. Right-click install-service.bat → "Run as administrator"

5. Verify the service is running:
   - Open Services (services.msc)
   - Look for "IMS Backend Service"
   - Status should be "Running"

6. Test the API:
   Open browser: http://localhost:3000

LOGS:
   Check the logs\ folder for:
   - startup.log        : Application startup info
   - service-stdout.log : Standard output
   - service-stderr.log : Errors
   - crash.log          : Crash reports

UNINSTALL:
   Right-click uninstall-service.bat → "Run as administrator"

TROUBLESHOOTING:
   - If service fails to start, check logs\ folder
   - Ensure .env file has correct database/LDAP settings
   - Ensure database is accessible from this machine
   - Ensure LDAP server is reachable
   - Run ims-backend.exe directly from command prompt to see errors


start Service:
.\install-service.bat

status check:
.\nssm.exe status IMS-Backend

stop service:  
.\uninstall-service.bat

Remove logs:
Remove-Item .\logs\*.log -ErrorAction SilentlyContinue
