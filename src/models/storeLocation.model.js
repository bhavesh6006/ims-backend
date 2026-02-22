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
  location_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'location_type',
      key: 'location_type_id'
    },
    comment: 'Foreign key reference to location_type'
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
    { fields: ['status'] }
  ]
});

module.exports = StoreLocation;
