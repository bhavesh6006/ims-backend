const express = require('express');
const router = express.Router();
const { isAuthenticated, isStoreManager } = require('../middleware/auth.middleware');

router.use(isAuthenticated);

router.get('/readers', (req, res) => res.json({ message: 'Get RFID readers' }));
router.get('/antennas', (req, res) => res.json({ message: 'Get RFID antennas' }));
router.post('/readers', isStoreManager, (req, res) => res.json({ message: 'Create RFID reader' }));
router.post('/antennas', isStoreManager, (req, res) => res.json({ message: 'Create RFID antenna' }));

module.exports = router;
