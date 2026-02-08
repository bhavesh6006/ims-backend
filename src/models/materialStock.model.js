const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialStock = sequelize.define('MaterialStock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  material_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Material code reference'
  },
  trolley_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Trolley code reference'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    },
    comment: 'Quantity of material in trolley'
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Physical location tracked via RFID antenna'
  },
  work_order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'work_orders',
      key: 'id'
    },
    comment: 'Reference to work order'
  },
  work_order_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Work order number reference'
  },
  loading_type: {
    type: DataTypes.ENUM('FULL', 'PARTIAL'),
    allowNull: true,
    comment: 'Type of loading - FULL or PARTIAL'
  },
  loaded_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'User who loaded the material'
  },
  loaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Timestamp when material was loaded'
  },
  status: {
    type: DataTypes.ENUM('IN_STOCK', 'IN_TRANSIT', 'CONSUMED'),
    defaultValue: 'IN_STOCK',
    allowNull: false,
    comment: 'Current status of material stock'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional remarks or notes'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'material_stock',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['material_code'] },
    { fields: ['trolley_code'] },
    { fields: ['work_order_id'] },
    { fields: ['status'] },
    { fields: ['location'] },
    { fields: ['material_code', 'trolley_code'], name: 'idx_material_trolley_lookup' }
  ]
});

module.exports = MaterialStock;
