require('dotenv').config();
const app = require('./app');
const http = require('http');
const sequelize = require('./config/database');
const mqttService = require('./services/mqtt.service');
const websocketService = require('./services/websocket.service');
const movementService = require('./services/movement.service');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize MQTT service and event handlers
async function initializeMQTT() {
  try {
    await mqttService.connect();
    
    // Subscribe to RFID events and process movements
    mqttService.on('rfid-read', async (rfidEvent) => {
      try {
        await movementService.processRFIDEvent(rfidEvent);
      } catch (error) {
        logger.error('Error processing RFID event:', error);
      }
    });

    // Subscribe to BLE events
    mqttService.on('ble-beacon', (bleEvent) => {
      logger.info('BLE Beacon detected:', bleEvent);
      websocketService.broadcastRFIDRead(bleEvent);
    });

    // Subscribe to gate crossing events
    mqttService.on('gate-crossing', (gateEvent) => {
      logger.info('Gate crossing detected:', gateEvent);
      websocketService.broadcastGateCrossing(gateEvent);
    });

    // Subscribe to reader status updates
    mqttService.on('reader-status', (statusUpdate) => {
      logger.info('Reader status update:', statusUpdate);
    });

    logger.info('✅ MQTT service initialized with event handlers');
  } catch (error) {
    logger.error('❌ Failed to initialize MQTT service:', error);
    // Continue without MQTT if it fails
  }
}

// Initialize WebSocket service
async function initializeWebSocket() {
  try {
    websocketService.initialize(server);
    logger.info('✅ WebSocket service initialized');
  } catch (error) {
    logger.error('❌ Failed to initialize WebSocket service:', error);
  }
}

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✓ Database connection established successfully');

    // Sync database
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('✓ Database synced successfully');

    // Initialize MQTT for RFID/BLE communication
    await initializeMQTT();

    // Initialize WebSocket for real-time updates
    await initializeWebSocket();

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`✓ API available at http://localhost:${PORT}/api/v1`);
      logger.info(`🔌 WebSocket available on port ${PORT}`);
    });

  } catch (error) {
    logger.error('✗ Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close MQTT connection
  if (mqttService) {
    await mqttService.disconnect();
    logger.info('MQTT service disconnected');
  }

  // Close WebSocket connections
  if (websocketService) {
    websocketService.close();
    logger.info('WebSocket service closed');
  }

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

startServer();
