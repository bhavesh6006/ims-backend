const express = require('express');
const router = express.Router();
const trollyController = require('../src/controllers/trolly.controller')

router.get('/', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Get all trollies
router.get('/trollies', trollyController.getAllTrollies);

module.exports = router;