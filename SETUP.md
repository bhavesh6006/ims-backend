# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 13+ installed
- MQTT Broker (optional - included in Docker setup)
- LDAP Server access (Active Directory or OpenLDAP)

## Setup Steps

### 1. Install Dependencies

```bash
cd c:\Users\ADhonde\Documents\ims-backend
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
copy .env.example .env

# Edit .env and configure:
# - Database credentials (PostgreSQL)
# - LDAP server details
# - MQTT broker URL
# - Work Order API details
# - Session secret
```

### 3. Database Setup

#### Using Docker (Recommended)

```bash
# Start all services (PostgreSQL, MQTT, Backend)
npm run docker:run

# View logs
docker-compose logs -f
```

#### Manual Setup

```bash
# Create database
createdb ims_factory

# Initialize database with sample data
npm run seed

# Start application
npm start
```

### 4. Verify Installation

```bash
# Check health endpoint
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "success",
#   "message": "IMS Factory Floor System is healthy",
#   "services": {
#     "database": "connected",
#     "mqtt": "configured",
#     "ldap": "configured"
#   }
# }
```

### 5. Test LDAP Authentication

```bash
# Test login (replace with your LDAP credentials)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_ldap_username",
    "password": "your_ldap_password"
  }'
```

### 6. Configure RFID Readers

RFID readers should publish to MQTT topics:

```
Topic: rfid/events/{readerId}
Payload:
{
  "readerId": "READER-001",
  "antennaId": "ANT-001",
  "antennaPort": 1,
  "epc": "E28011700000020123456789",
  "rssi": -55,
  "timestamp": "2024-01-20T10:30:45.000Z"
}
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | findstr postgres

# Or manually:
psql -U imsadmin -d ims_factory -h localhost
```

### MQTT Connection Issues

```bash
# Check MQTT broker
docker logs ims-mqtt

# Test MQTT subscription
docker exec -it ims-mqtt mosquitto_sub -t '#' -v
```

### LDAP Issues

```bash
# Test LDAP connection (Windows)
# Use LDAP Admin tool or test with:
# ldp.exe (Windows LDAP client)

# Or use PowerShell
Test-Connection -ComputerName your-ldap-server -Port 389
```

## Next Steps

1. **Configure Master Data**
   - Create Store Locations via API
   - Add Materials with position definitions
   - Configure Trolly-Material mappings
   - Setup RFID Readers and Antennas
   - Define Smart Gates

2. **Test Operator Workflow**
   - Login as operator
   - Scan trolly (RFID/Barcode)
   - Select work order
   - Load trolly with materials
   - Track movement through gates

3. **Monitor Real-time Events**
   - Connect to WebSocket
   - Subscribe to location/trolly events
   - View live movement tracking

## Development Mode

```bash
# Start with auto-reload
npm run dev

# Initialize database
npm run init-db

# Seed sample data
npm run seed
```

## Production Deployment

```bash
# Build Docker image
npm run docker:build

# Deploy with Docker Compose
npm run docker:run

# Scale backend service
docker-compose up -d --scale ims-backend=3
```

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f ims-backend

# Restart services
docker-compose restart

# Stop all services
npm run docker:stop

# Remove all data
docker-compose down -v
```

## API Testing

Use the provided [API Documentation](docs/API.md) for endpoint details.

Test with curl, Postman, or any HTTP client.

Example Postman collection available at: [docs/postman-collection.json] (to be created)

## Support

- Documentation: [README.md](README.md)
- API Docs: [docs/API.md](docs/API.md)
- Issues: GitHub Issues
