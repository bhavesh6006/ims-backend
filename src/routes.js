const express = require('express');
const router = express.Router();
const trollyController = require('../src/controllers/trolly.controller');
const materialController = require('./controllers/material.controller');

router.get('/', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// **** TROLLY ROUTES ****
// Get all trollies
router.get('/trollies', trollyController.getAllTrollies);

// Get trolly by ID
router.get('/trollies/:id', trollyController.getTrollyById);

// Create trolly
router.post('/trollies/', trollyController.createTrolly);

// Update trolly
router.put('/trollies/:id', trollyController.updateTrolly);

// Delete trolly
router.delete('/trollies/:id', trollyController.deleteTrolly);



// **** MATERIAL ROUTES ****
// Get all materials
router.get('/materials', materialController.getAllMaterials);

// Get material by ID
router.get('/materials/:id', materialController.getMaterialById);

// Create material
router.post('/materials/', materialController.createMaterial);

// Update material
router.put('/materials/:id', materialController.updateMaterial);

// Delete material
router.delete('/materials/:id', materialController.deleteMaterial);

module.exports = router;