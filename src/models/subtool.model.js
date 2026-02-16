const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subtool = sequelize.define('Subtool', {
  subtool_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Subtool name/description'
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
  tableName: 'subtool',
  timestamps: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['subtool_id'] }
  ]
});

module.exports = Subtool;
