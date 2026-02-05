const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  material_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  material_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Material Code'
  },
  material_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Material name/description'
  },
  material_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'material_type',
      key: 'material_type_id'
    },
    comment: 'Foreign key reference to material_type'
  },
  subtool_position_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'subtool_position',
      key: 'subtool_position_id'
    },
    comment: 'Foreign key reference to subtool_position'
  },
  length_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Length in cm'
  },
  width_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Width in cm'
  },
  height_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Height in cm'
  },
  weight_kg: {
    type: DataTypes.DECIMAL(10, 3),
    comment: 'Weight in kg'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE'
  },
}, {
  tableName: 'material',
  indexes: [
    { fields: ['material_id'] },
    { fields: ['material_code'] },
    { fields: ['material_type_id'] },
    { fields: ['subtool_position_id'] }
  ]
});

// Associations with MaterialType and SubtoolPosition
Material.associate = (models) => {
  Material.belongsTo(models.MaterialType, {
    foreignKey: 'material_type_id',
    as: 'materialType'
  });
  Material.belongsTo(models.SubtoolPosition, {
    foreignKey: 'subtool_position_id',
    as: 'subtoolPosition'
  });
};

module.exports = Material;