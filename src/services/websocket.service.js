const socketIO = require('socket.io');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connections = new Map();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('✅ WebSocket server initialized');
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      this.connections.set(socket.id, { socket, connectedAt: new Date() });

      // Handle client authentication
      socket.on('authenticate', (data) => {
        this.handleAuthentication(socket, data);
      });

      // Handle subscribe to specific locations
      socket.on('subscribe:location', (locationId) => {
        socket.join(`location:${locationId}`);
        console.log(`📍 Client ${socket.id} subscribed to location ${locationId}`);
      });

      // Handle subscribe to specific trolly
      socket.on('subscribe:trolly', (trollyId) => {
        socket.join(`trolly:${trollyId}`);
        console.log(`🛒 Client ${socket.id} subscribed to trolly ${trollyId}`);
      });

      // Handle unsubscribe
      socket.on('unsubscribe:location', (locationId) => {
        socket.leave(`location:${locationId}`);
      });

      socket.on('unsubscribe:trolly', (trollyId) => {
        socket.leave(`trolly:${trollyId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
        this.connections.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Handle client authentication
   */
  handleAuthentication(socket, data) {
    if (data && data.userId) {
      const connection = this.connections.get(socket.id);
      if (connection) {
        connection.userId = data.userId;
        connection.role = data.role;
        socket.emit('authenticated', { success: true });
        console.log(`✅ Client ${socket.id} authenticated as user ${data.userId}`);
      }
    } else {
      socket.emit('authenticated', { success: false, message: 'Invalid authentication data' });
    }
  }

  /**
   * Broadcast trolly movement event
   */
  broadcastTrollyMovement(movement) {
    const payload = {
      type: 'trolly_movement',
      timestamp: new Date(),
      data: movement
    };

    // Broadcast to all clients
    this.io.emit('trolly:movement', payload);

    // Broadcast to specific trolly subscribers
    if (movement.trollyId) {
      this.io.to(`trolly:${movement.trollyId}`).emit('trolly:update', payload);
    }

    // Broadcast to location subscribers
    if (movement.toLocationId) {
      this.io.to(`location:${movement.toLocationId}`).emit('location:update', payload);
    }
  }

  /**
   * Broadcast RFID tag read event
   */
  broadcastRFIDRead(rfidEvent) {
    const payload = {
      type: 'rfid_read',
      timestamp: new Date(),
      data: rfidEvent
    };

    this.io.emit('rfid:read', payload);
  }

  /**
   * Broadcast gate crossing event
   */
  broadcastGateCrossing(gateEvent) {
    const payload = {
      type: 'gate_crossing',
      timestamp: new Date(),
      data: gateEvent
    };

    this.io.emit('gate:crossing', payload);

    // Broadcast to location subscribers
    if (gateEvent.locationId) {
      this.io.to(`location:${gateEvent.locationId}`).emit('location:gate_event', payload);
    }
  }

  /**
   * Broadcast trolly loading event
   */
  broadcastTrollyLoading(loadingEvent) {
    const payload = {
      type: 'trolly_loading',
      timestamp: new Date(),
      data: loadingEvent
    };

    this.io.emit('loading:update', payload);

    if (loadingEvent.trollyId) {
      this.io.to(`trolly:${loadingEvent.trollyId}`).emit('trolly:loading', payload);
    }
  }

  /**
   * Broadcast inventory update
   */
  broadcastInventoryUpdate(inventory) {
    const payload = {
      type: 'inventory_update',
      timestamp: new Date(),
      data: inventory
    };

    this.io.emit('inventory:update', payload);

    if (inventory.locationId) {
      this.io.to(`location:${inventory.locationId}`).emit('location:inventory', payload);
    }
  }

  /**
   * Broadcast alert/notification
   */
  broadcastAlert(alert) {
    const payload = {
      type: 'alert',
      timestamp: new Date(),
      data: alert
    };

    this.io.emit('alert', payload);

    // Send to specific users if specified
    if (alert.userIds && Array.isArray(alert.userIds)) {
      alert.userIds.forEach(userId => {
        const userConnections = Array.from(this.connections.values())
          .filter(conn => conn.userId === userId);
        
        userConnections.forEach(conn => {
          conn.socket.emit('user:alert', payload);
        });
      });
    }
  }

  /**
   * Send message to specific socket
   */
  sendToSocket(socketId, event, data) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.socket.emit(event, data);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([id, conn]) => ({
        socketId: id,
        userId: conn.userId,
        connectedAt: conn.connectedAt
      }))
    };
  }

  /**
   * Close WebSocket server
   */
  close() {
    if (this.io) {
      this.io.close();
      console.log('WebSocket server closed');
    }
  }
}

// Export singleton instance
module.exports = new WebSocketService();
