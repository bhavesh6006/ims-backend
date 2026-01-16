const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkOrder = sequelize.define('WorkOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  wo_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Work Order number from external system'
  },
  wo_type: {
    type: DataTypes.STRING(50),
    comment: 'Work order type'
  },
  product_code: {
    type: DataTypes.STRING(100),
    comment: 'Product/item code'
  },
  product_description: {
    type: DataTypes.TEXT,
    comment: 'Product description'
  },
  quantity: {
    type: DataTypes.INTEGER,
    comment: 'Planned quantity'
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'pcs'
  },
  door_types: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    comment: 'Types of doors if applicable'
  },
  door_orientation: {
    type: DataTypes.STRING(50),
    comment: 'Door orientation (e.g., left, right)'
  },
  sfg_fg_classification: {
    type: DataTypes.ENUM('sfg', 'fg', 'raw'),
    comment: 'Semi-Finished Goods / Finished Goods classification'
  },
  start_date: {
    type: DataTypes.DATE,
    comment: 'Work order start date'
  },
  due_date: {
    type: DataTypes.DATE,
    comment: 'Work order due date'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('planned', 'released', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'planned'
  },
  assigned_store_location_id: {
    type: DataTypes.UUID,
    references: {
      model: 'store_locations',
      key: 'id'
    },
    comment: 'Store location for material picking'
  },
  external_metadata: {
    type: DataTypes.JSONB,
    comment: 'Full JSON payload from external WO system'
  },
  sync_status: {
    type: DataTypes.ENUM('synced', 'pending', 'error'),
    defaultValue: 'synced'
  },
  synced_at: {
    type: DataTypes.DATE,
    comment: 'Last synchronization timestamp'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'work_orders',
  indexes: [
    { fields: ['wo_number'] },
    { fields: ['status'] },
    { fields: ['start_date'] },
    { fields: ['due_date'] }
  ]
});

module.exports = WorkOrder;
