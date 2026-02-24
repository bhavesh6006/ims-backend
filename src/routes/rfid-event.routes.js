const express = require('express');
const router = express.Router();
const rfidEventController = require('../controllers/rfid-event.controller');

router.post('/', rfidEventController.processRfidEvent);

module.exports = router;
