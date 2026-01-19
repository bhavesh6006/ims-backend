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
  material_type: {
    type: DataTypes.ENUM('plastic', 'metal', 'rubber', 'composite', 'wood', 'glass', 'other'),
    allowNull: false,
    comment: 'Material type classification'
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
    { fields: ['material_code'] }
  ]
});

module.exports = Material;