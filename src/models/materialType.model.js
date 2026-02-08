const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialType = sequelize.define('MaterialType', {
  material_type_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  material_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Material type name/description'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'material_type',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['material_type_id'] }
  ]
});

module.exports = MaterialType;
