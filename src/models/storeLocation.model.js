const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoreLocation = sequelize.define('StoreLocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_location_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique store location identifier'
  },
  store_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Name of the store/warehouse'
  },
  factory_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Factory name'
  },
  plant_building_name: {
    type: DataTypes.STRING(100),
    comment: 'Plant or building name'
  },
  location_hierarchy: {
    type: DataTypes.STRING(200),
    comment: 'Hierarchical path: Factory > Plant > Store'
  },
  floor_number: {
    type: DataTypes.INTEGER,
    comment: 'Floor number if applicable'
  },
  zone_name: {
    type: DataTypes.STRING(100),
    comment: 'Zone or section name'
  },
  total_area: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Total area in square meters'
  },
  area_unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'sq_mtr',
    comment: 'Unit of measurement for area'
  },
  address: {
    type: DataTypes.TEXT,
    comment: 'Physical address'
  },
  coordinates: {
    type: DataTypes.JSONB,
    comment: 'GPS coordinates: {latitude, longitude}'
  },
  capacity_info: {
    type: DataTypes.JSONB,
    comment: 'Storage capacity information'
  },
  manager_name: {
    type: DataTypes.STRING(100)
  },
  contact_number: {
    type: DataTypes.STRING(20)
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'store_locations',
  indexes: [
    { fields: ['store_location_id'] },
    { fields: ['factory_name'] },
    { fields: ['store_name'] },
    { fields: ['status'] }
  ]
});

module.exports = StoreLocation;
