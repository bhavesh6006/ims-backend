const express = require('express');
const router = express.Router();
const movementService = require('../services/movement.service');
const { isAuthenticated } = require('../middleware/auth.middleware');

router.use(isAuthenticated);

// Get trolly movement history
router.get('/trolly/:trollyId', async (req, res) => {
  try {
    const movements = await movementService.getTrollyMovementHistory(req.params.trollyId, req.query);
    res.json({ success: true, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trollies in location
router.get('/location/:locationId', async (req, res) => {
  try {
    const trollies = await movementService.getTrolliesInLocation(req.params.locationId);
    res.json({ success: true, data: trollies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
