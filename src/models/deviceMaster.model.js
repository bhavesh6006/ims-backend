const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceMaster = sequelize.define('DeviceMaster', {
  device_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  device_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(100)
  },
  department: {
    type: DataTypes.STRING(50)
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: false,
    unique: true
  },
  mac_address: {
    type: DataTypes.STRING(50)
  },
  hostname: {
    type: DataTypes.STRING(50)
  },
  serial_no: {
    type: DataTypes.STRING(50)
  },
  manufacturer: {
    type: DataTypes.STRING(50),
    defaultValue: 'Zebra'
  },
  model: {
    type: DataTypes.STRING(50),
    defaultValue: 'FX9600'
  },
  firmware_version: {
    type: DataTypes.STRING(50)
  },
  os_description: {
    type: DataTypes.TEXT
  },
  total_antennas: {
    type: DataTypes.INTEGER
  },
  active_antennas: {
    type: DataTypes.INTEGER
  },
  last_llrp_sync: {
    type: DataTypes.DATE
  },
  uptime_sec: {
    type: DataTypes.BIGINT
  },
  cpu_usage: {
    type: DataTypes.DECIMAL(5, 2)
  },
  temperature: {
    type: DataTypes.DECIMAL(5, 2)
  },
  memory_free_mb: {
    type: DataTypes.DECIMAL(10, 2)
  },
  last_snmp_sync: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('ONLINE', 'OFFLINE', 'MAINTENANCE'),
    allowNull: false,
    defaultValue: 'OFFLINE'
  },
  last_seen_time: {
    type: DataTypes.DATE
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  installed_on: {
    type: DataTypes.DATEONLY
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
  tableName: 'device_master',
  timestamps: false
});

module.exports = DeviceMaster;
