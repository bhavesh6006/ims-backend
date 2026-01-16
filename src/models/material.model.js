const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  material_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique material identifier'
  },
  material_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Material name/description'
  },
  material_type: {
    type: DataTypes.ENUM('plastic', 'metal', 'rubber', 'composite', 'wood', 'glass', 'other'),
    allowNull: false,
    comment: 'Material type classification'
  },
  category: {
    type: DataTypes.STRING(100),
    comment: 'Material category (e.g., Door, Frame, Panel)'
  },
  sub_category: {
    type: DataTypes.STRING(100),
    comment: 'Material sub-category'
  },
  length: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Length in cm'
  },
  width: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Width in cm'
  },
  height: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Height in cm'
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Weight in kg'
  },
  allowed_positions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Allowed loading positions: left, right, left_upper, left_lower, right_upper, right_lower'
  },
  sfg_fg_classification: {
    type: DataTypes.ENUM('sfg', 'fg', 'raw'),
    comment: 'Semi-Finished Goods / Finished Goods / Raw Material'
  },
  unit_of_measure: {
    type: DataTypes.STRING(20),
    defaultValue: 'pcs',
    comment: 'Unit of measurement'
  },
  notes: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
    defaultValue: 'active'
  }
}, {
  tableName: 'materials',
  indexes: [
    { fields: ['material_id'] },
    { fields: ['material_type'] },
    { fields: ['category'] },
    { fields: ['sfg_fg_classification'] }
  ]
});

module.exports = Material;
