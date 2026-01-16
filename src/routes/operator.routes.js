const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operator.controller');
const { isAuthenticated, isOperator } = require('../middleware/auth.middleware');

// All routes require operator authentication
router.use(isAuthenticated);
router.use(isOperator);

// Scan trolly to start loading process
router.post('/scan-trolly', operatorController.scanTrolly);

// Get available work orders
router.get('/work-orders', operatorController.getWorkOrders);

// Check trolly-material compatibility
router.get('/compatibility/:trollyId/:materialId', operatorController.getCompatibility);

// Load trolly with materials
router.post('/load-trolly', operatorController.loadTrolly);

// Unload trolly
router.put('/unload-trolly/:loadingId', operatorController.unloadTrolly);

// Get operator's loading history
router.get('/loading-history', operatorController.getLoadingHistory);

module.exports = router;
