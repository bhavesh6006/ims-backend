const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrollyMaterialMapping = sequelize.define('TrollyMaterialMapping', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trolly_type: {
    type: DataTypes.ENUM('bin', 'rack', 'pallet', 'cage', 'custom'),
    allowNull: false
  },
  material_type: {
    type: DataTypes.ENUM('plastic', 'metal', 'rubber', 'composite', 'wood', 'glass', 'other'),
    allowNull: false
  },
  material_category: {
    type: DataTypes.STRING(100),
    comment: 'Specific material category if applicable'
  },
  max_capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Maximum material count at full capacity'
  },
  position_wise_capacity: {
    type: DataTypes.JSONB,
    comment: 'Capacity per position: {left: 10, right: 10, left_upper: 5, ...}'
  },
  weight_limit: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Maximum weight limit in kg'
  },
  compatibility_rules: {
    type: DataTypes.JSONB,
    comment: 'Additional compatibility rules and constraints'
  },
  effective_from: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  effective_to: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'trolly_material_mappings',
  indexes: [
    { fields: ['trolly_type', 'material_type'] },
    { fields: ['status'] }
  ]
});

module.exports = TrollyMaterialMapping;
