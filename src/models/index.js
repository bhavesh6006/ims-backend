const sequelize = require('../config/database');
const User = require('./user.model');
const Trolly = require('./trolly.model');
const Material = require('./material.model');
const TrollyMaterialMapping = require('./trollyMaterialMapping.model');
const StoreLocation = require('./storeLocation.model');
const RFIDReader = require('./rfidReader.model');
const RFIDAntenna = require('./rfidAntenna.model');
const BLEGateway = require('./bleGateway.model');
const Gate = require('./gate.model');
const WorkOrder = require('./workOrder.model');
const TrollyLoading = require('./trollyLoading.model');
const MovementTracking = require('./movementTracking.model');

// Define associations

// StoreLocation relationships
StoreLocation.hasMany(Trolly, { foreignKey: 'current_location_id', as: 'trollies' });
Trolly.belongsTo(StoreLocation, { foreignKey: 'current_location_id', as: 'currentLocation' });

StoreLocation.hasMany(RFIDReader, { foreignKey: 'store_location_id', as: 'rfidReaders' });
RFIDReader.belongsTo(StoreLocation, { foreignKey: 'store_location_id', as: 'storeLocation' });

StoreLocation.hasMany(BLEGateway, { foreignKey: 'store_location_id', as: 'bleGateways' });
BLEGateway.belongsTo(StoreLocation, { foreignKey: 'store_location_id', as: 'storeLocation' });

StoreLocation.hasMany(Gate, { foreignKey: 'store_location_id', as: 'gates' });
Gate.belongsTo(StoreLocation, { foreignKey: 'store_location_id', as: 'storeLocation' });

// RFIDReader and RFIDAntenna relationships
RFIDReader.hasMany(RFIDAntenna, { foreignKey: 'reader_id', as: 'antennas' });
RFIDAntenna.belongsTo(RFIDReader, { foreignKey: 'reader_id', as: 'reader' });

RFIDAntenna.belongsTo(StoreLocation, { foreignKey: 'store_location_id', as: 'storeLocation' });
StoreLocation.hasMany(RFIDAntenna, { foreignKey: 'store_location_id', as: 'antennas' });

// Gate and Antenna relationships
Gate.belongsTo(RFIDAntenna, { foreignKey: 'entry_antenna_id', as: 'entryAntenna' });
Gate.belongsTo(RFIDAntenna, { foreignKey: 'exit_antenna_id', as: 'exitAntenna' });
Gate.belongsTo(RFIDAntenna, { foreignKey: 'zone_a_antenna_id', as: 'zoneAAntenna' });
Gate.belongsTo(RFIDAntenna, { foreignKey: 'zone_b_antenna_id', as: 'zoneBAntenna' });

// Gate location relationships
Gate.belongsTo(StoreLocation, { foreignKey: 'from_location_id', as: 'fromLocation' });
Gate.belongsTo(StoreLocation, { foreignKey: 'to_location_id', as: 'toLocation' });

// WorkOrder relationships
WorkOrder.belongsTo(StoreLocation, { foreignKey: 'assigned_store_location_id', as: 'assignedLocation' });
WorkOrder.hasMany(TrollyLoading, { foreignKey: 'work_order_id', as: 'loadings' });

// TrollyLoading relationships
TrollyLoading.belongsTo(Trolly, { foreignKey: 'trolly_id', as: 'trolly' });
TrollyLoading.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });
TrollyLoading.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });
TrollyLoading.belongsTo(StoreLocation, { foreignKey: 'store_location_id', as: 'location' });
TrollyLoading.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });
TrollyLoading.belongsTo(User, { foreignKey: 'verified_by_id', as: 'verifier' });
TrollyLoading.belongsTo(User, { foreignKey: 'unloaded_by_id', as: 'unloader' });

Trolly.hasMany(TrollyLoading, { foreignKey: 'trolly_id', as: 'loadings' });
Material.hasMany(TrollyLoading, { foreignKey: 'material_id', as: 'loadings' });
User.hasMany(TrollyLoading, { foreignKey: 'operator_id', as: 'loadingsPerformed' });

// MovementTracking relationships
MovementTracking.belongsTo(Trolly, { foreignKey: 'trolly_id', as: 'trolly' });
MovementTracking.belongsTo(StoreLocation, { foreignKey: 'from_location_id', as: 'fromLocation' });
MovementTracking.belongsTo(StoreLocation, { foreignKey: 'to_location_id', as: 'toLocation' });
MovementTracking.belongsTo(Gate, { foreignKey: 'gate_id', as: 'gate' });
MovementTracking.belongsTo(RFIDAntenna, { foreignKey: 'antenna_id', as: 'antenna' });
MovementTracking.belongsTo(RFIDReader, { foreignKey: 'reader_id', as: 'reader' });
MovementTracking.belongsTo(TrollyLoading, { foreignKey: 'loading_id', as: 'loading' });
MovementTracking.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });
MovementTracking.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

Trolly.hasMany(MovementTracking, { foreignKey: 'trolly_id', as: 'movements' });
Gate.hasMany(MovementTracking, { foreignKey: 'gate_id', as: 'movements' });
TrollyLoading.hasMany(MovementTracking, { foreignKey: 'loading_id', as: 'movements' });

const db = {
  sequelize,
  User,
  Trolly,
  Material,
  TrollyMaterialMapping,
  StoreLocation,
  RFIDReader,
  RFIDAntenna,
  BLEGateway,
  Gate,
  WorkOrder,
  TrollyLoading,
  MovementTracking
};

module.exports = db;
