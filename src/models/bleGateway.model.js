const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BLEGateway = sequelize.define('BLEGateway', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  gateway_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique BLE gateway identifier'
  },
  gateway_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  manufacturer: {
    type: DataTypes.STRING(100),
    comment: 'Gateway manufacturer'
  },
  model: {
    type: DataTypes.STRING(100)
  },
  mac_address: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: 'Gateway MAC address'
  },
  ip_address: {
    type: DataTypes.STRING(45)
  },
  serial_number: {
    type: DataTypes.STRING(100),
    unique: true
  },
  firmware_version: {
    type: DataTypes.STRING(50)
  },
  store_location_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'store_locations',
      key: 'id'
    }
  },
  coverage_area: {
    type: DataTypes.TEXT,
    comment: 'Description of BLE coverage area'
  },
  position: {
    type: DataTypes.JSONB,
    comment: 'Physical position coordinates'
  },
  rssi_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: -70,
    comment: 'RSSI threshold for proximity detection'
  },
  scan_interval: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
    comment: 'Scan interval in milliseconds'
  },
  installation_date: {
    type: DataTypes.DATE
  },
  last_maintenance_date: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'maintenance', 'error'),
    defaultValue: 'offline'
  },
  health_status: {
    type: DataTypes.JSONB,
    comment: 'Gateway health metrics'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'ble_gateways',
  indexes: [
    { fields: ['gateway_id'] },
    { fields: ['store_location_id'] },
    { fields: ['status'] }
  ]
});

module.exports = BLEGateway;
