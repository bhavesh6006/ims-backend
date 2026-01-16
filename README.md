# IMS Factory Floor RFID/BLE Tracking System

## Overview

IoT-enabled inventory management system for factory floor tracking using RFID/BLE technology. This system provides real-time tracking of trollies/containers, material movement through smart gates, operator workflow management, and Work Order integration for Digital Twin visualization.

## Key Features

- **RFID/BLE Tracking**: Real-time trolly and material position tracking
- **LDAP Authentication**: Enterprise user authentication with role-based access control
- **Smart Gate Detection**: Automatic entry/exit detection via RFID antenna arrays
- **Work Order Integration**: External Work Order system integration
- **Real-time Updates**: WebSocket-based live updates
- **Operator Workflow**: Trolly scanning, material loading with position validation
- **Movement History**: Complete audit trail of trolly movements
- **Hierarchical Locations**: Factory → Plant → Store → Zone structure

## Tech Stack

- Node.js 18+, Express.js
- PostgreSQL with Sequelize ORM
- LDAP Authentication (passport-ldapauth)
- MQTT (Eclipse Mosquitto) for RFID/BLE communication
- Socket.IO for WebSocket
- Docker & Docker Compose

## Quick Start

### Using Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/bhavesh6006/ims-backend.git
cd ims-backend

# Configure environment
cp .env.example .env
# Edit .env with your LDAP, MQTT, and WO API settings

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f ims-backend
```

Access API at: `http://localhost:5000/api/v1`

### Manual Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Create database
createdb ims_factory

# Start MQTT broker
mosquitto -c mqtt/config/mosquitto.conf

# Start application
npm start
```

## Configuration

### Environment Variables

**Database**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ims_factory
DB_USER=imsadmin
DB_PASSWORD=your_password
```

**LDAP**
```env
LDAP_URL=ldap://your-server:389
LDAP_BIND_DN=cn=admin,dc=company,dc=com
LDAP_BIND_PASSWORD=ldap_password
LDAP_SEARCH_BASE=ou=users,dc=company,dc=com
LDAP_GROUP_ADMIN=cn=ims-admins,ou=groups,dc=company,dc=com
LDAP_GROUP_OPERATOR=cn=ims-operators,ou=groups,dc=company,dc=com
```

**MQTT**
```env
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_TOPIC_RFID_EVENTS=rfid/events/#
MQTT_TOPIC_BLE_EVENTS=ble/events/#
```

**Work Order API**
```env
WO_API_BASE_URL=https://your-wo-system.com/api
WO_API_KEY=your_api_key
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - LDAP login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Operator Workflow
- `POST /api/v1/operator/scan-trolly` - Scan trolly (RFID/Barcode/QR)
- `GET /api/v1/operator/work-orders` - Get available work orders
- `GET /api/v1/operator/compatibility/:trollyId/:materialId` - Check compatibility
- `POST /api/v1/operator/load-trolly` - Load trolly with materials
- `PUT /api/v1/operator/unload-trolly/:id` - Unload trolly
- `GET /api/v1/operator/loading-history` - Get loading history

### Trolly Management
- `GET /api/v1/trollies` - List trollies
- `GET /api/v1/trollies/rfid/:tag` - Get by RFID tag
- `POST /api/v1/trollies` - Create trolly
- `PUT /api/v1/trollies/:id` - Update trolly

### Movement Tracking
- `GET /api/v1/movements/trolly/:id` - Trolly movement history
- `GET /api/v1/movements/location/:id` - Trollies in location

### Master Data
- Materials: `/api/v1/materials`
- Locations: `/api/v1/locations`
- Gates: `/api/v1/gates`
- RFID: `/api/v1/rfid/readers`, `/api/v1/rfid/antennas`
- Work Orders: `/api/v1/work-orders`

## Data Models

### Core Entities

1. **Trolly**: RFID-tagged container (bin/rack/pallet/cage)
2. **Material**: Materials with allowed positions
3. **Store Location**: Factory → Plant → Store hierarchy
4. **Gate**: Smart gates with antenna pairs
5. **RFID Reader/Antenna**: Hardware configuration
6. **Work Order**: External work order integration
7. **Trolly Loading**: Loading transactions
8. **Movement Tracking**: Movement audit trail

### Position System

Materials can be loaded in positions:
- `left`, `right`
- `left_upper`, `left_lower`
- `right_upper`, `right_lower`

## MQTT Integration

### RFID Event Format

Publish to: `rfid/events/{readerId}`

```json
{
  "readerId": "READER-001",
  "antennaId": "ANT-001",
  "antennaPort": 1,
  "epc": "E28011700000020123456789",
  "rssi": -55,
  "timestamp": "2024-01-20T10:30:45.000Z"
}
```

### BLE Event Format

Publish to: `ble/events/{gatewayId}`

```json
{
  "gatewayId": "BLE-GW-001",
  "beaconMac": "AA:BB:CC:DD:EE:FF",
  "rssi": -70,
  "timestamp": "2024-01-20T10:30:45.000Z"
}
```

## WebSocket Events

Subscribe to real-time updates:

```javascript
// Connect
const socket = io('http://localhost:5000');

// Authenticate
socket.emit('authenticate', { userId: 'user-id', role: 'operator' });

// Subscribe to location
socket.emit('subscribe:location', 'LOCATION-001');

// Listen to events
socket.on('trolly:movement', (data) => {
  console.log('Trolly moved:', data);
});

socket.on('trolly:loading', (data) => {
  console.log('Trolly loaded:', data);
});

socket.on('gate:crossing', (data) => {
  console.log('Gate crossed:', data);
});
```

## User Roles

1. **Admin**: Full system access
2. **Store Manager**: Location and configuration management
3. **Storekeeper**: Inventory and master data
4. **Operator**: Loading/unloading operations

## Development

```bash
# Development mode with auto-reload
npm run dev

# Linting
npm run lint

# Testing
npm test
```

## Deployment

### Docker Production

```bash
# Build image
docker build -t ims-backend:latest .

# Deploy
docker-compose -f docker-compose.yml up -d

# Scale
docker-compose up -d --scale ims-backend=3
```

### Health Check

```bash
curl http://localhost:5000/health
```

## Monitoring

### Logs

```bash
# Docker
docker-compose logs -f ims-backend

# Manual
tail -f logs/combined.log
```

### Metrics

Monitor:
- Database connection pool
- MQTT connection status
- WebSocket connections
- API response times

## Troubleshooting

### LDAP Issues
- Verify LDAP_URL accessibility
- Check BIND_DN credentials
- Test: `ldapsearch -H ${LDAP_URL} -D ${LDAP_BIND_DN} -W`

### MQTT Issues
- Check broker: `docker ps | grep mqtt`
- View logs: `docker logs ims-mqtt`
- Test: `mosquitto_sub -t '#' -h localhost`

### Database Issues
```bash
# Force sync in development
NODE_ENV=development npm start
```

## Security

- LDAP authentication (no password storage)
- Session-based authentication
- HTTPS in production
- API rate limiting
- Input validation
- SQL injection prevention

## Architecture

```
┌──────────────┐
│ RFID Readers ├──┐
│ BLE Gateways │  │
└──────────────┘  │
                  v
              ┌───────┐       ┌─────────┐
              │ MQTT  ├──────►│ Backend ├───► PostgreSQL
              │Broker │       │ Service │
              └───────┘       └────┬────┘
                                   │
                   ┌───────────────┼──────────────┐
                   v               v              v
              ┌─────────┐    ┌─────────┐    ┌──────────┐
              │WebSocket│    │  LDAP   │    │   WO     │
              │Clients  │    │ Server  │    │   API    │
              └─────────┘    └─────────┘    └──────────┘
```

## License

MIT

## Support

- GitHub Issues: https://github.com/bhavesh6006/ims-backend/issues
- Email: support@company.com
