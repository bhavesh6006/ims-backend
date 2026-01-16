const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrollyLoading = sequelize.define('TrollyLoading', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  loading_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique loading transaction identifier'
  },
  trolly_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'trollies',
      key: 'id'
    }
  },
  work_order_id: {
    type: DataTypes.UUID,
    references: {
      model: 'work_orders',
      key: 'id'
    },
    comment: 'Associated work order'
  },
  material_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'materials',
      key: 'id'
    }
  },
  store_location_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'store_locations',
      key: 'id'
    },
    comment: 'Loading location'
  },
  loading_type: {
    type: DataTypes.ENUM('full', 'partial'),
    allowNull: false,
    comment: 'Full capacity or partial loading'
  },
  quantity_loaded: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Quantity of materials loaded'
  },
  positions_used: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    comment: 'Positions where materials are loaded: [left, right, left_upper, ...]'
  },
  position_details: {
    type: DataTypes.JSONB,
    comment: 'Detailed position allocation: {left: 5, right: 5, left_upper: 2, ...}'
  },
  operator_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Operator who performed loading'
  },
  loading_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  verified_by_id: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Supervisor/manager who verified'
  },
  verified_at: {
    type: DataTypes.DATE
  },
  unloading_timestamp: {
    type: DataTypes.DATE,
    comment: 'When materials were unloaded'
  },
  unloaded_by_id: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('loaded', 'in_transit', 'delivered', 'unloaded'),
    defaultValue: 'loaded'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'trolly_loadings',
  indexes: [
    { fields: ['loading_id'] },
    { fields: ['trolly_id'] },
    { fields: ['work_order_id'] },
    { fields: ['material_id'] },
    { fields: ['operator_id'] },
    { fields: ['loading_timestamp'] },
    { fields: ['status'] }
  ]
});

module.exports = TrollyLoading;
