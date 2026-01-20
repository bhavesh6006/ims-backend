const express = require('express');
const router = express.Router();
const trollyController = require('./controllers/trolly.controller');
const materialController = require('./controllers/material.controller');
const UserController = require('./controllers/user.controller');
const UserRoleController = require('./controllers/userRole.controller');
const UserRoleMapController = require('./controllers/userRoleMap.controller');

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

// User routes
router.get('/users', UserController.getAllUsers);
router.post('/users', UserController.createUser);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

// User Role routes
router.get('/user-roles', UserRoleController.getAllRoles);
router.post('/user-roles', UserRoleController.createRole);
router.put('/user-roles/:id', UserRoleController.updateRole);
router.delete('/user-roles/:id', UserRoleController.deleteRole);

// User Role Mapping routes
router.get('/user-role-mappings', UserRoleMapController.getAllMappings);
router.get('/user-role-mappings/:userId', UserRoleMapController.getMappingByUserId);
router.post('/user-role-mappings', UserRoleMapController.createMapping);
router.delete('/user-role-mappings/:userId', UserRoleMapController.deleteMappingByUserId);
router.put('/user-role-mappings/:userId', UserRoleMapController.updateMapping);

module.exports = router;
