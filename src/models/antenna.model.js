const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Antenna = sequelize.define('Antenna', {
  antenna_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  antenna_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  antenna_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  antenna_type: {
    type: DataTypes.ENUM('RFID', 'BLE'),
    allowNull: false
  },
  frequency_range: {
    type: DataTypes.STRING(50)
  },
  gain_dbi: {
    type: DataTypes.DECIMAL(5,2)
  },
  reader_id: {
    type: DataTypes.STRING(50)
  },
  reader_port: {
    type: DataTypes.INTEGER
  },
  antenna_role: {
    type: DataTypes.STRING(50)
  },
  orientation: {
    type: DataTypes.STRING(50)
  },
  mounting_type: {
    type: DataTypes.STRING(50)
  },
  tx_power_dbm: {
    type: DataTypes.DECIMAL(5,2)
  },
  coverage_desc: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE'),
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
  tableName: 'antenna',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Antenna;
