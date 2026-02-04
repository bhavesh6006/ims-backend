const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trolly = sequelize.define('Trolly', {
  trolley_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trolley_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Trolley Code'
  },
  trolley_type: {
    type: DataTypes.ENUM('bin', 'rack', 'pallet', 'cage', 'custom'),
    allowNull: false,
    comment: 'Type of trolley/container'
  },
  trolley_image: {
    type: DataTypes.TEXT,
    comment: 'Image in base64 format for trolley'
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
  length_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Length in cm'
  },
  width_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Width in cm'
  },
  height_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Height in cm'
  },
  volume_mm3: {
    type: DataTypes.DECIMAL(15, 2),
    comment: 'Volume in cubic cm'
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'Additional notes or remarks'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE'
  },
}, {
  tableName: 'trolley',
  indexes: [
    { fields: ['trolley_id'] },
    { fields: ['trolley_code'] }
  ]
});

module.exports = Trolly;