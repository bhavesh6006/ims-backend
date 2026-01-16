const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const trollyRoutes = require('./trolly.routes');
const materialRoutes = require('./material.routes');
const storeLocationRoutes = require('./storeLocation.routes');
const gateRoutes = require('./gate.routes');
const rfidRoutes = require('./rfid.routes');
const workOrderRoutes = require('./workOrder.routes');
const movementRoutes = require('./movement.routes');
const operatorRoutes = require('./operator.routes');

// API routes
router.use('/auth', authRoutes);
router.use('/trollies', trollyRoutes);
router.use('/materials', materialRoutes);
router.use('/locations', storeLocationRoutes);
router.use('/gates', gateRoutes);
router.use('/rfid', rfidRoutes);
router.use('/work-orders', workOrderRoutes);
router.use('/movements', movementRoutes);
router.use('/operator', operatorRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    message: 'IMS Factory Floor RFID/BLE Tracking System API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: '/auth',
      trollies: '/trollies',
      materials: '/materials',
      locations: '/locations',
      gates: '/gates',
      rfid: '/rfid',
      workOrders: '/work-orders',
      movements: '/movements',
      operator: '/operator'
    }
  });
});

module.exports = router;
