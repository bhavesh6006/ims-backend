const express = require('express');
const router = express.Router();
const trollyController = require('./controllers/trolly.controller');
const trollyTypeController = require('./controllers/trollyType.controller');
const materialController = require('./controllers/material.controller');
const materialTypeController = require('./controllers/materialType.controller');
const subtoolPositionController = require('./controllers/subtoolPosition.controller');
const antennaController = require('./controllers/antenna.controller');
const storeLocationController = require('./controllers/storeLocation.controller');
const UserController = require('./controllers/user.controller');
const UserRoleController = require('./controllers/userRole.controller');
const UserRoleMapController = require('./controllers/userRoleMap.controller');
const trolleyMaterialMappingController = require('./controllers/trolleyMaterialMapping.controller');

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

// Trolly Type Routes
router.get('/trolly-types', trollyTypeController.getAllTrollyTypes);
router.get('/trolly-types/:id', trollyTypeController.getTrollyTypeById);
router.post('/trolly-types', trollyTypeController.createTrollyType);
router.put('/trolly-types/:id', trollyTypeController.updateTrollyType);
router.delete('/trolly-types/:id', trollyTypeController.deleteTrollyType);

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

// Subtool Position Routes
router.get('/subtool-positions', subtoolPositionController.getAllSubtoolPositions);
router.get('/subtool-positions/:id', subtoolPositionController.getSubtoolPositionById);
router.post('/subtool-positions', subtoolPositionController.createSubtoolPosition);
router.put('/subtool-positions/:id', subtoolPositionController.updateSubtoolPosition);
router.delete('/subtool-positions/:id', subtoolPositionController.deleteSubtoolPosition);

// Antenna Routes
router.get('/antennas', antennaController.getAllAntennas);
router.get('/antennas/:id', antennaController.getAntennaById);
router.post('/antennas', antennaController.createAntenna);
router.put('/antennas/:id', antennaController.updateAntenna);
router.delete('/antennas/:id', antennaController.deleteAntenna);

// Store Location Routes
router.get('/store-locations', storeLocationController.getAllStoreLocations);
router.get('/store-locations/:id', storeLocationController.getStoreLocationById);
router.post('/store-locations', storeLocationController.createStoreLocation);
router.put('/store-locations/:id', storeLocationController.updateStoreLocation);
router.delete('/store-locations/:id', storeLocationController.deleteStoreLocation);

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

// Trolley-Material Mapping Routes
router.post('/trolley-material-mapping', trolleyMaterialMappingController.createMapping);
router.get('/trolley-material-mapping', trolleyMaterialMappingController.getAllMappings);
router.get('/trolley-material-mapping/trolley-type/:trolleyTypeId', trolleyMaterialMappingController.getMappingsByTrolleyType);
router.get('/trolley-material-mapping/:mappingId', trolleyMaterialMappingController.getMappingById);
router.put('/trolley-material-mapping/:trolleyTypeId', trolleyMaterialMappingController.editMapping);
router.delete('/trolley-material-mapping/:mappingId', trolleyMaterialMappingController.deleteMapping);

module.exports = router;
