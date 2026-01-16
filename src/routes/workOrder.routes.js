const express = require('express');
const router = express.Router();
const workOrderService = require('../services/workorder.service');
const { isAuthenticated } = require('../middleware/auth.middleware');

router.use(isAuthenticated);

// Get work orders
router.get('/', async (req, res) => {
  try {
    const workOrders = await workOrderService.getAvailableWorkOrders(req.query);
    res.json({ success: true, data: workOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get work order by number
router.get('/:woNumber', async (req, res) => {
  try {
    const workOrder = await workOrderService.getWorkOrderDetails(req.params.woNumber);
    res.json({ success: true, data: workOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync work orders from external API
router.post('/sync', async (req, res) => {
  try {
    const result = await workOrderService.syncWorkOrders(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
