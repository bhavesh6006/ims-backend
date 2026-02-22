const sequelize = require('../config/database');
const Material = require('./material.model');
const MaterialType = require('./materialType.model');
const Subtool = require('./subtool.model');
const TrollyType = require('./trollyType.model');
const TrolleyMaterialMapping = require('./trolleyMaterialMapping.model');
const Antenna = require('./antenna.model');
const StoreLocation = require('./storeLocation.model');
const StoreLocationAntenna = require('./storeLocationAntenna.model');
const MaterialStock = require('./materialStock.model');
const WorkOrder = require('./workOrder.model');
const TrollyCondition = require('./trollyCondition.model');
const DeviceMaster = require('./deviceMaster.model');
const LocationType = require('./locationType.model');

// Define all associations here
Material.belongsTo(MaterialType, {
  foreignKey: 'material_type_id',
  as: 'materialType'
});

Material.belongsTo(Subtool, {
  foreignKey: 'subtool_id',
  as: 'subtool'
});

MaterialType.hasMany(Material, {
  foreignKey: 'material_type_id',
  as: 'materials'
});

TrolleyMaterialMapping.belongsTo(TrollyType, {
  foreignKey: 'trolley_type_id',
  as: 'trolleyType'
});

TrolleyMaterialMapping.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material'
});

TrollyType.hasMany(TrolleyMaterialMapping, {
  foreignKey: 'trolley_type_id',
  as: 'mappings'
});

Material.hasMany(TrolleyMaterialMapping, {
  foreignKey: 'material_id',
  as: 'mappings'
});

StoreLocation.belongsTo(LocationType, {
  foreignKey: 'location_type_id',
  as: 'locationType'
});

Antenna.hasMany(StoreLocationAntenna, {
  foreignKey: 'antenna_id',
  as: 'storeMappings'
});

// Device Master <-> Antenna associations
DeviceMaster.hasMany(Antenna, {
  foreignKey: 'device_id',
  as: 'antennas'
});

Antenna.belongsTo(DeviceMaster, {
  foreignKey: 'device_id',
  as: 'device'
});

Antenna.belongsTo(StoreLocation, {
  foreignKey: 'store_location_id',
  as: 'storeLocation'
});

// Export models
module.exports = {
  sequelize,
  Material,
  MaterialType,
  Subtool,
  TrollyType,
  TrolleyMaterialMapping,
  Antenna,
  StoreLocation,
  StoreLocationAntenna,
  MaterialStock,
  WorkOrder,
  TrollyCondition,
  LocationType,
  DeviceMaster
};
