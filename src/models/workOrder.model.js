const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkOrder = sequelize.define('WorkOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  work_order_number: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: 'Unique work order identifier'
  },
  sr_no: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Serial number'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Work order date'
  },
  tool: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Tool name'
  },
  sub_tool: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Material code - links to material master'
  },
  door_colour: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Door colour specification'
  },
  handle: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Handle specification'
  },
  micom: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Micom specification'
  },
  lock1: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Lock specification'
  },
  disp_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Display type'
  },
  input_plan: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Planned input quantity'
  },
  output_plan: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Actual output quantity loaded'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'CLOSED'),
    defaultValue: 'PENDING',
    allowNull: false,
    comment: 'Work order status'
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
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'User who created the work order'
  },
  updated_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'User who last updated the work order'
  }
}, {
  tableName: 'work_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['work_order_number'] },
    { fields: ['status'] },
    { fields: ['date'] },
    { fields: ['sub_tool'] }
  ]
});

module.exports = WorkOrder;
