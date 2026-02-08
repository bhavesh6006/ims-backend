const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoreLocation = sequelize.define('StoreLocation', {
  store_location_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  store_name: {
    type: DataTypes.STRING(100)
  },
  factory_name: {
    type: DataTypes.STRING(100)
  },
  plant_name: {
    type: DataTypes.STRING(100)
  },
  hierarchy_level: {
    type: DataTypes.STRING(100)
  },
  total_area: {
    type: DataTypes.DECIMAL(12,2)
  },
  area_unit: {
    type: DataTypes.STRING(10)
  },
  status: {
    type: DataTypes.ENUM('ACTIVE','INACTIVE'),
    allowNull: false,
    defaultValue: 'ACTIVE'
  },
  remarks: {
    type: DataTypes.TEXT
  },
  movement_type: {
    type: DataTypes.ENUM('IN','OUT'),
    allowNull: false
  },
  antenna_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'antenna',
      key: 'antenna_id'
    }
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
  tableName: 'store_location',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['store_location_id'] },
    { fields: ['store_code'] },
    { fields: ['status'] },
    { fields: ['antenna_id'] },
    { fields: ['movement_type'] }
  ]
});

module.exports = StoreLocation;
