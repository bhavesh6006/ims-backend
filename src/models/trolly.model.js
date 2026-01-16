const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trolly = sequelize.define('Trolly', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trolly_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique trolly identifier'
  },
  trolly_type: {
    type: DataTypes.ENUM('bin', 'rack', 'pallet', 'cage', 'custom'),
    allowNull: false,
    comment: 'Type of trolly/container'
  },
  barcode: {
    type: DataTypes.STRING(100),
    unique: true,
    comment: 'Barcode identifier'
  },
  qr_code: {
    type: DataTypes.STRING(200),
    unique: true,
    comment: 'QR code identifier'
  },
  rfid_tag: {
    type: DataTypes.STRING(100),
    unique: true,
    comment: 'RFID tag EPC/TID'
  },
  length: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Length in cm'
  },
  width: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Width in cm'
  },
  height: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Height in cm'
  },
  volume: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Volume in cubic cm'
  },
  weight_capacity: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Maximum weight capacity in kg'
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'Additional notes or remarks'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'damaged'),
    defaultValue: 'active'
  },
  current_location_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Current store location'
  },
  last_scanned_at: {
    type: DataTypes.DATE,
    comment: 'Last RFID scan timestamp'
  }
}, {
  tableName: 'trollies',
  indexes: [
    { fields: ['trolly_id'] },
    { fields: ['trolly_type'] },
    { fields: ['rfid_tag'] },
    { fields: ['barcode'] },
    { fields: ['status'] }
  ]
});

module.exports = Trolly;
