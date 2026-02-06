const sequelize = require('../config/database');
const Material = require('./material.model');
const MaterialType = require('./materialType.model');
const SubtoolPosition = require('./subtoolPosition.model');

// Define all associations here
Material.belongsTo(MaterialType, {
  foreignKey: 'material_type_id',
  as: 'materialType'
});

MaterialType.hasMany(Material, {
  foreignKey: 'material_type_id',
  as: 'materials'
});

// Export models
module.exports = {
  sequelize,
  Material,
  MaterialType,
  SubtoolPosition
};
