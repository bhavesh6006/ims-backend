const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RFIDReader = sequelize.define('RFIDReader', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reader_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique RFID reader identifier'
  },
  reader_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  manufacturer: {
    type: DataTypes.STRING(100),
    comment: 'Reader manufacturer (e.g., Zebra, Impinj)'
  },
  model: {
    type: DataTypes.STRING(100),
    comment: 'Reader model number'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    comment: 'Reader IP address'
  },
  mac_address: {
    type: DataTypes.STRING(50),
    comment: 'Reader MAC address'
  },
  serial_number: {
    type: DataTypes.STRING(100),
    unique: true
  },
  firmware_version: {
    type: DataTypes.STRING(50)
  },
  connection_type: {
    type: DataTypes.ENUM('ethernet', 'wifi', 'serial'),
    defaultValue: 'ethernet'
  },
  store_location_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'store_locations',
      key: 'id'
    }
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
    comment: 'Reader health metrics: temperature, uptime, etc.'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'rfid_readers',
  indexes: [
    { fields: ['reader_id'] },
    { fields: ['store_location_id'] },
    { fields: ['status'] }
  ]
});

module.exports = RFIDReader;
