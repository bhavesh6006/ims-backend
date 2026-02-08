const sequelize = require('../config/database');
const Material = require('./material.model');
const MaterialType = require('./materialType.model');
const SubtoolPosition = require('./subtoolPosition.model');
const TrollyType = require('./trollyType.model');
const TrolleyMaterialMapping = require('./trolleyMaterialMapping.model');
const Antenna = require('./antenna.model');

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

// Export models
module.exports = {
  sequelize,
  Material,
  MaterialType,
  SubtoolPosition,
  TrollyType,
  TrolleyMaterialMapping
  ,Antenna
};
