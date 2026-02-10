const sequelize = require('../config/database');
const Material = require('./material.model');
const MaterialType = require('./materialType.model');
const SubtoolPosition = require('./subtoolPosition.model');
const TrollyType = require('./trollyType.model');
const TrolleyMaterialMapping = require('./trolleyMaterialMapping.model');
const Antenna = require('./antenna.model');
const StoreLocation = require('./storeLocation.model');
const StoreLocationAntenna = require('./storeLocationAntenna.model');
const MaterialStock = require('./materialStock.model');
const WorkOrder = require('./workOrder.model');

// Define all associations here
Material.belongsTo(MaterialType, {
  foreignKey: 'material_type_id',
  as: 'materialType'
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

// Mapping associations: store location <-> antenna (many)
StoreLocation.hasMany(StoreLocationAntenna, {
  foreignKey: 'store_location_id',
  as: 'antennaMappings'
});

StoreLocationAntenna.belongsTo(StoreLocation, {
  foreignKey: 'store_location_id',
  as: 'storeLocation'
});

StoreLocationAntenna.belongsTo(Antenna, {
  foreignKey: 'antenna_id',
  as: 'antenna'
});

Antenna.hasMany(StoreLocationAntenna, {
  foreignKey: 'antenna_id',
  as: 'storeMappings'
});

// Export models
module.exports = {
  sequelize,
  Material,
  MaterialType,
  SubtoolPosition,
  TrollyType,
  TrolleyMaterialMapping,
  Antenna,
  StoreLocation,
  StoreLocationAntenna,
  MaterialStock,
  WorkOrder
};
