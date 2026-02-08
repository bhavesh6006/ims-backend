const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoreLocationAntenna = sequelize.define('StoreLocationAntenna', {
  mapping_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_location_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'store_location',
      key: 'store_location_id'
    }
  },
  antenna_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'antenna',
      key: 'antenna_id'
    }
  },
  movement_type: {
    type: DataTypes.ENUM('IN','OUT'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE','INACTIVE'),
    allowNull: false,
    defaultValue: 'ACTIVE'
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
  tableName: 'store_location_antenna',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['store_location_id'] },
    { fields: ['antenna_id'] },
    { fields: ['movement_type'] },
    { fields: ['status'] }
  ]
});

module.exports = StoreLocationAntenna;
