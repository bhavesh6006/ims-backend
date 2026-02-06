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
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    comment: 'Array of subtool position IDs'
  },
  length_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Length in mm'
  },
  width_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Width in mm'
  },
  height_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Height in mm'
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
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['material_id'] },
    { fields: ['material_code'] },
    { fields: ['material_type_id'] }
  ]
});

module.exports = Material;