# API Documentation

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

All endpoints (except `/auth/login`) require authentication via LDAP session.

### Headers

```
Cookie: connect.sid=<session-cookie>
```

---

## Authentication Endpoints

### POST /auth/login

Login with LDAP credentials.

**Request Body:**
```json
{
  "username": "john.doe",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "operator",
    "department": "Production"
  }
}
```

### GET /auth/me

Get current authenticated user.

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "role": "operator"
  }
}
```

### POST /auth/logout

Logout current user.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Operator Workflow Endpoints

### POST /operator/scan-trolly

Scan trolly by RFID tag, barcode, or QR code.

**Request Body:**
```json
{
  "identifier": "E280117000000201234567890",
  "scanType": "rfid"
}
```

**scanType**: `rfid`, `barcode`, `qr`, or `trolly_id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Trolly scanned successfully",
  "data": {
    "trolly": {
      "id": "uuid",
      "trolly_id": "TROLLY-001",
      "trolly_type": "rack",
      "rfid_tag": "E280117000000201234567890",
      "status": "active"
    },
    "currentLocation": {
      "store_location_id": "LOC-001",
      "store_name": "Main Warehouse"
    }
  }
}
```

### GET /operator/work-orders

Get available work orders for selection.

**Query Parameters:**
- `startDate`: Filter by start date (YYYY-MM-DD)
- `endDate`: Filter by end date
- `woType`: Filter by work order type
- `status`: Filter by status (default: planned, released, in_progress)

**Response (200 OK):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "wo_number": "WO-2024-001",
      "product_code": "DOOR-001",
      "quantity": 100,
      "door_types": ["left", "right"],
      "status": "released",
      "start_date": "2024-01-20",
      "due_date": "2024-01-25"
    }
  ]
}
```

### GET /operator/compatibility/:trollyId/:materialId

Check if trolly and material are compatible.

**Response (200 OK):**
```json
{
  "success": true,
  "compatible": true,
  "data": {
    "maxCapacity": 20,
    "positionWiseCapacity": {
      "left": 5,
      "right": 5,
      "left_upper": 5,
      "right_upper": 5
    },
    "weightLimit": 500,
    "allowedPositions": ["left", "right", "left_upper", "right_upper"]
  }
}
```

### POST /operator/load-trolly

Load trolly with materials (full or partial).

**Request Body:**
```json
{
  "trollyId": "TROLLY-001",
  "workOrderNumber": "WO-2024-001",
  "materialId": "MAT-001",
  "loadingType": "full",
  "quantityLoaded": 20,
  "positions": ["left", "right", "left_upper", "right_upper"],
  "positionDetails": {
    "left": 5,
    "right": 5,
    "left_upper": 5,
    "right_upper": 5
  },
  "locationId": "uuid",
  "notes": "Loading for WO-2024-001"
}
```

**loadingType**: `full` or `partial`

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Trolly loaded successfully",
  "data": {
    "loading_id": "LOAD-1234567890-ABC",
    "trolly_id": "uuid",
    "material_id": "uuid",
    "loading_type": "full",
    "quantity_loaded": 20,
    "status": "loaded"
  }
}
```

### PUT /operator/unload-trolly/:loadingId

Unload trolly.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Trolly unloaded successfully",
  "data": {
    "loading_id": "LOAD-1234567890-ABC",
    "status": "unloaded",
    "unloading_timestamp": "2024-01-20T15:30:00.000Z"
  }
}
```

### GET /operator/loading-history

Get operator's loading history.

**Query Parameters:**
- `limit`: Number of records (default: 50)
- `startDate`: Filter by date
- `endDate`: Filter by date

**Response (200 OK):**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "loading_id": "LOAD-1234567890-ABC",
      "trolly": { "trolly_id": "TROLLY-001" },
      "material": { "material_id": "MAT-001" },
      "quantity_loaded": 20,
      "loading_timestamp": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

---

## Trolly Management Endpoints

### GET /trollies

List all trollies.

**Query Parameters:**
- `status`: Filter by status (active, inactive, maintenance, damaged)
- `type`: Filter by type (bin, rack, pallet, cage, custom)
- `location`: Filter by current location

**Response (200 OK):**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "trolly_id": "TROLLY-001",
      "trolly_type": "rack",
      "rfid_tag": "E280117000000201234567890",
      "barcode": "BC-TROLLY-001",
      "status": "active",
      "currentLocation": {
        "store_name": "Main Warehouse"
      }
    }
  ]
}
```

### GET /trollies/:id

Get trolly by ID.

### GET /trollies/rfid/:rfidTag

Get trolly by RFID tag.

### POST /trollies

Create new trolly (Storekeeper+ only).

**Request Body:**
```json
{
  "trolly_id": "TROLLY-003",
  "trolly_type": "rack",
  "rfid_tag": "E280117000000201234567892",
  "barcode": "BC-TROLLY-003",
  "qr_code": "QR-TROLLY-003",
  "length": 120,
  "width": 80,
  "height": 150,
  "weight_capacity": 500,
  "status": "active"
}
```

### PUT /trollies/:id

Update trolly (Storekeeper+ only).

### DELETE /trollies/:id

Delete trolly (Storekeeper+ only).

---

## Movement Tracking Endpoints

### GET /movements/trolly/:trollyId

Get trolly movement history.

**Query Parameters:**
- `limit`: Number of records (default: 100)
- `startDate`: Filter by date
- `endDate`: Filter by date

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "tracking_id": "TRK-1234567890-ABC",
      "trolly_id": "uuid",
      "rfid_tag": "E280117000000201234567890",
      "gate": {
        "gate_name": "Entry Gate 1"
      },
      "fromLocation": {
        "store_name": "Main Warehouse"
      },
      "toLocation": {
        "store_name": "Assembly Store"
      },
      "movement_type": "entry",
      "direction": "inbound",
      "rfid_read_time": "2024-01-20T10:30:45.000Z"
    }
  ]
}
```

### GET /movements/location/:locationId

Get trollies currently in location.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "trolly_id": "TROLLY-001",
      "trolly_type": "rack",
      "currentLocation": {
        "store_name": "Main Warehouse"
      }
    }
  ]
}
```

---

## Work Order Endpoints

### GET /work-orders

Get work orders.

**Query Parameters:**
- `startDate`, `endDate`, `woType`, `status`

### GET /work-orders/:woNumber

Get work order by number.

### POST /work-orders/sync

Sync work orders from external API.

---

## WebSocket Events

Connect to WebSocket:

```javascript
const socket = io('http://localhost:5000');

// Authenticate
socket.emit('authenticate', {
  userId: 'user-id',
  role: 'operator'
});

// Subscribe to location updates
socket.emit('subscribe:location', 'LOCATION-001');

// Subscribe to trolly updates
socket.emit('subscribe:trolly', 'TROLLY-001');
```

### Events from Server

**trolly:movement**
```json
{
  "type": "trolly_movement",
  "timestamp": "2024-01-20T10:30:45.000Z",
  "data": {
    "trackingId": "TRK-123",
    "trollyId": "TROLLY-001",
    "gateName": "Entry Gate 1",
    "movementType": "entry"
  }
}
```

**trolly:loading**
```json
{
  "type": "trolly_loading",
  "timestamp": "2024-01-20T10:30:45.000Z",
  "data": {
    "loadingId": "LOAD-123",
    "trollyId": "TROLLY-001",
    "materialId": "MAT-001",
    "quantity": 20
  }
}
```

**gate:crossing**
```json
{
  "type": "gate_crossing",
  "timestamp": "2024-01-20T10:30:45.000Z",
  "data": {
    "gateId": "GATE-001",
    "trollyId": "TROLLY-001",
    "direction": "inbound"
  }
}
```

---

## Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "trolly_id",
      "message": "Trolly ID is required"
    }
  ]
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "required": ["admin", "store_manager"],
  "current": "operator"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Trolly not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 200 per window
- **Response (429)**:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```
