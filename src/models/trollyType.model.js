const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrollyType = sequelize.define('TrollyType', {
  trolly_type_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trolly_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Trolly type name/description'
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
  tableName: 'trolly_type',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['trolly_type_id'] }
  ]
});

module.exports = TrollyType;
