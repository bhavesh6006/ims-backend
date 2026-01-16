const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RFIDAntenna = sequelize.define('RFIDAntenna', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  antenna_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique antenna identifier'
  },
  antenna_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  reader_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rfid_readers',
      key: 'id'
    },
    comment: 'Associated RFID reader'
  },
  reader_port_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Port number on the reader'
  },
  store_location_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'store_locations',
      key: 'id'
    }
  },
  antenna_type: {
    type: DataTypes.ENUM('circular_polarized', 'linear_polarized'),
    defaultValue: 'circular_polarized'
  },
  frequency_range: {
    type: DataTypes.STRING(50),
    comment: 'e.g., 865-868 MHz'
  },
  gain: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Antenna gain in dBi'
  },
  antenna_role: {
    type: DataTypes.ENUM('entry', 'exit', 'zone_a', 'zone_b', 'inside', 'outside', 'neutral'),
    allowNull: false,
    comment: 'Role for direction detection logic'
  },
  orientation: {
    type: DataTypes.ENUM('left', 'right', 'top', 'bottom', 'ceiling', 'floor'),
    comment: 'Physical orientation'
  },
  mounting_type: {
    type: DataTypes.ENUM('gate', 'dock_door', 'ceiling', 'zone', 'wall'),
    comment: 'Installation type'
  },
  tx_power: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Transmit power in dBm'
  },
  coverage_area: {
    type: DataTypes.TEXT,
    comment: 'Description of coverage area'
  },
  position: {
    type: DataTypes.JSONB,
    comment: 'Physical position coordinates'
  },
  installation_date: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'rfid_antennas',
  indexes: [
    { fields: ['antenna_id'] },
    { fields: ['reader_id'] },
    { fields: ['store_location_id'] },
    { fields: ['antenna_role'] }
  ]
});

module.exports = RFIDAntenna;
