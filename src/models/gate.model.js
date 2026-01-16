const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gate = sequelize.define('Gate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  gate_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique gate identifier'
  },
  gate_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Gate name (e.g., Entry Gate 1, Exit Gate A)'
  },
  store_location_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'store_locations',
      key: 'id'
    }
  },
  gate_type: {
    type: DataTypes.ENUM('entry', 'exit', 'bidirectional'),
    allowNull: false,
    comment: 'Gate direction type'
  },
  entry_antenna_id: {
    type: DataTypes.UUID,
    references: {
      model: 'rfid_antennas',
      key: 'id'
    },
    comment: 'Antenna detecting entry (outside)'
  },
  exit_antenna_id: {
    type: DataTypes.UUID,
    references: {
      model: 'rfid_antennas',
      key: 'id'
    },
    comment: 'Antenna detecting exit (inside)'
  },
  zone_a_antenna_id: {
    type: DataTypes.UUID,
    references: {
      model: 'rfid_antennas',
      key: 'id'
    },
    comment: 'Optional Zone A antenna for advanced detection'
  },
  zone_b_antenna_id: {
    type: DataTypes.UUID,
    references: {
      model: 'rfid_antennas',
      key: 'id'
    },
    comment: 'Optional Zone B antenna for advanced detection'
  },
  detection_logic: {
    type: DataTypes.ENUM('simple_entry_exit', 'zone_based', 'rssi_based', 'time_sequence'),
    defaultValue: 'simple_entry_exit',
    comment: 'Algorithm for direction detection'
  },
  time_window: {
    type: DataTypes.INTEGER,
    defaultValue: 5000,
    comment: 'Time window in milliseconds for event correlation'
  },
  access_control: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether gate has access control'
  },
  width: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Gate width in meters'
  },
  position: {
    type: DataTypes.JSONB,
    comment: 'Physical position coordinates'
  },
  from_location_id: {
    type: DataTypes.UUID,
    references: {
      model: 'store_locations',
      key: 'id'
    },
    comment: 'Source location (for exit movements)'
  },
  to_location_id: {
    type: DataTypes.UUID,
    references: {
      model: 'store_locations',
      key: 'id'
    },
    comment: 'Destination location (for entry movements)'
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
  tableName: 'gates',
  indexes: [
    { fields: ['gate_id'] },
    { fields: ['store_location_id'] },
    { fields: ['gate_type'] },
    { fields: ['status'] }
  ]
});

module.exports = Gate;
