const express = require('express');
const router = express.Router();
const trollyController = require('../controllers/trolly.controller');
const { isAuthenticated, isStorekeeper } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(isAuthenticated);

// Get all trollies
router.get('/', trollyController.getAllTrollies);

// Get trolly by RFID tag
router.get('/rfid/:rfidTag', trollyController.getTrollyByRFID);

// Get trolly by ID
router.get('/:id', trollyController.getTrollyById);

// Create trolly (storekeeper+ only)
router.post('/', isStorekeeper, trollyController.createTrolly);

// Update trolly (storekeeper+ only)
router.put('/:id', isStorekeeper, trollyController.updateTrolly);

// Delete trolly (storekeeper+ only)
router.delete('/:id', isStorekeeper, trollyController.deleteTrolly);

module.exports = router;
