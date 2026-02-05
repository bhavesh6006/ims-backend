const express = require('express');
const router = express.Router();
const trollyController = require('./controllers/trolly.controller');
const materialController = require('./controllers/material.controller');
const materialTypeController = require('./controllers/materialType.controller');
const UserController = require('./controllers/user.controller');
const UserRoleController = require('./controllers/userRole.controller');
const UserRoleMapController = require('./controllers/userRoleMap.controller');

router.get('/', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Trollies Routes
router.get('/trollies', trollyController.getAllTrollies);
router.get('/trollies/scan/:trollyCode', trollyController.getTrollyByCode);
router.get('/trollies/:id', trollyController.getTrollyById);
router.post('/trollies/', trollyController.createTrolly);
router.put('/trollies/:id', trollyController.updateTrolly);
router.delete('/trollies/:id', trollyController.deleteTrolly);

// Materials Routes
router.get('/materials', materialController.getAllMaterials);
router.get('/materials/:id', materialController.getMaterialById);
router.post('/materials/', materialController.createMaterial);
router.put('/materials/:id', materialController.updateMaterial);
router.delete('/materials/:id', materialController.deleteMaterial);

// Material Type Routes
router.get('/material-types', materialTypeController.getAllMaterialTypes);
router.get('/material-types/:id', materialTypeController.getMaterialTypeById);
router.post('/material-types', materialTypeController.createMaterialType);
router.put('/material-types/:id', materialTypeController.updateMaterialType);
router.delete('/material-types/:id', materialTypeController.deleteMaterialType);

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
