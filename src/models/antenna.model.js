const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Antenna = sequelize.define('Antenna', {
  antenna_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'device_master',
      key: 'device_id'
    }
  },
  antenna_no: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  antenna_name: {
    type: DataTypes.STRING(50)
  },
  location_name: {
    type: DataTypes.STRING(100)
  },
  zone_id: {
    type: DataTypes.INTEGER
  },
  antenna_type: {
    type: DataTypes.STRING(50)
  },
  polarization: {
    type: DataTypes.STRING(20)
  },
  manufacturer: {
    type: DataTypes.STRING(50)
  },
  model: {
    type: DataTypes.STRING(50)
  },
  tx_power_dbm: {
    type: DataTypes.DECIMAL(5, 2)
  },
  rx_sensitivity: {
    type: DataTypes.DECIMAL(5, 2)
  },
  orientation: {
    type: DataTypes.STRING(20)
  },
  mounting_height_m: {
    type: DataTypes.DECIMAL(5, 2)
  },
  facing_angle_deg: {
    type: DataTypes.DECIMAL(5, 2)
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_connected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_seen_time: {
    type: DataTypes.DATE
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
  tableName: 'antenna_master',
  timestamps: false, // We're managing created_at and updated_at manually
  indexes: [
    {
      unique: true,
      fields: ['device_id', 'antenna_no']
    }
  ]
});

module.exports = Antenna;
