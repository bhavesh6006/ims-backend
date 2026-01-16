const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovementTracking = sequelize.define('MovementTracking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tracking_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique tracking identifier'
  },
  trolly_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'trollies',
      key: 'id'
    }
  },
  rfid_tag: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'RFID tag read from trolly'
  },
  from_location_id: {
    type: DataTypes.UUID,
    references: {
      model: 'store_locations',
      key: 'id'
    },
    comment: 'Source location'
  },
  to_location_id: {
    type: DataTypes.UUID,
    references: {
      model: 'store_locations',
      key: 'id'
    },
    comment: 'Destination location'
  },
  gate_id: {
    type: DataTypes.UUID,
    references: {
      model: 'gates',
      key: 'id'
    },
    comment: 'Gate through which movement occurred'
  },
  antenna_id: {
    type: DataTypes.UUID,
    references: {
      model: 'rfid_antennas',
      key: 'id'
    },
    comment: 'Antenna that detected the tag'
  },
  reader_id: {
    type: DataTypes.UUID,
    references: {
      model: 'rfid_readers',
      key: 'id'
    },
    comment: 'Reader that processed the tag'
  },
  movement_type: {
    type: DataTypes.ENUM('entry', 'exit', 'internal_transfer', 'zone_movement'),
    allowNull: false,
    comment: 'Type of movement detected'
  },
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound', 'lateral'),
    comment: 'Movement direction'
  },
  detection_method: {
    type: DataTypes.ENUM('rfid', 'ble', 'barcode', 'manual'),
    defaultValue: 'rfid',
    comment: 'How the movement was detected'
  },
  rfid_read_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Exact timestamp of RFID read'
  },
  rssi: {
    type: DataTypes.INTEGER,
    comment: 'RSSI value at detection time'
  },
  read_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Number of tag reads in the event'
  },
  loading_id: {
    type: DataTypes.UUID,
    references: {
      model: 'trolly_loadings',
      key: 'id'
    },
    comment: 'Associated loading transaction'
  },
  work_order_id: {
    type: DataTypes.UUID,
    references: {
      model: 'work_orders',
      key: 'id'
    },
    comment: 'Associated work order'
  },
  operator_id: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Operator associated with movement'
  },
  is_anomaly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Flag for anomalous movements'
  },
  anomaly_reason: {
    type: DataTypes.TEXT,
    comment: 'Reason for flagging as anomaly'
  },
  raw_event_data: {
    type: DataTypes.JSONB,
    comment: 'Raw RFID/BLE event data'
  },
  processed_at: {
    type: DataTypes.DATE,
    comment: 'When the movement was processed'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'movement_tracking',
  indexes: [
    { fields: ['tracking_id'] },
    { fields: ['trolly_id'] },
    { fields: ['rfid_tag'] },
    { fields: ['rfid_read_time'] },
    { fields: ['gate_id'] },
    { fields: ['movement_type'] },
    { fields: ['is_anomaly'] }
  ]
});

module.exports = MovementTracking;
