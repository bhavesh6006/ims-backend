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
const materialStockController = require('./controllers/materialStock.controller');
const workOrderController = require('./controllers/workOrder.controller');

// Middleware to log which route is being matched
router.use((req, res, next) => {
  console.log(`Matched route: ${req.method} ${req.originalUrl}`);
  next();
});

router.get('/', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Trollies Routes
router.get('/trollies', trollyController.getAllTrollies);
router.get('/trollies/scan/:trollyQRCode', trollyController.getTrollyByCode);
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
router.get('/materials/code/:materialCode', materialController.getMaterialByCode); // Must be before /:id
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
router.get('/getUnmappedAntennas', antennaController.getUnmappedAntennas);
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
// IMPORTANT: Specific routes MUST come BEFORE parameterized routes
router.post('/trolley-material-mapping', trolleyMaterialMappingController.createMapping);

// Specific search route - MUST be before any :param routes
router.get('/trolley-material-mapping/by-material-and-type', trolleyMaterialMappingController.getMappingByMaterialAndTrolleyType);

// Other specific routes
router.get('/trolley-material-mapping/trolley-type/:trolleyTypeId', trolleyMaterialMappingController.getMappingsByTrolleyType);

// Get all (no params)
router.get('/trolley-material-mapping', trolleyMaterialMappingController.getAllMappings);

// Generic :id routes MUST be LAST
router.get('/trolley-material-mapping/:mappingId', trolleyMaterialMappingController.getMappingById);
router.put('/trolley-material-mapping/:trolleyTypeId', trolleyMaterialMappingController.editMapping);
router.delete('/trolley-material-mapping/:mappingId', trolleyMaterialMappingController.deleteMapping);

// Material Stock Routes
router.post('/material-stock', materialStockController.createMaterialStock);
router.get('/material-stock', materialStockController.getAllMaterialStocks);
router.get('/material-stock/material/:materialCode', materialStockController.getMaterialStocksByMaterialCode);
router.get('/material-stock/trolley/:trolleyCode', materialStockController.getMaterialStocksByTrolleyCode);
router.get('/material-stock/work-order/:workOrderNumber', materialStockController.getMaterialStocksByWorkOrder);
router.get('/material-stock/summary/:materialCode', materialStockController.getStockSummaryByMaterial);
router.get('/material-stock/:id', materialStockController.getMaterialStockById);
router.put('/material-stock/:id/status', materialStockController.updateMaterialStockStatus);
router.put('/material-stock/:id', materialStockController.updateMaterialStock);
router.delete('/material-stock/:id', materialStockController.deleteMaterialStock);

// Work Order Routes
router.post('/work-orders', workOrderController.createWorkOrder);
router.get('/work-orders', workOrderController.getAllWorkOrders);
router.get('/work-orders/stats', workOrderController.getWorkOrderStats);
router.get('/work-orders/number/:workOrderNumber', workOrderController.getWorkOrderByNumber);
router.get('/work-orders/:id', workOrderController.getWorkOrderById);
router.put('/work-orders/:id', workOrderController.updateWorkOrder);
router.put('/work-orders/:id/status', workOrderController.updateWorkOrderStatus);
router.put('/work-orders/:id/output-plan', workOrderController.updateOutputPlan);
router.delete('/work-orders/:id', workOrderController.deleteWorkOrder);

module.exports = router;
