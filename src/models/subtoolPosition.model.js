const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubtoolPosition = sequelize.define('SubtoolPosition', {
  subtool_position_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  subtool_position: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Subtool position name/description'
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
  tableName: 'subtool_position',
  timestamps: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['subtool_position_id'] }
  ]
});

module.exports = SubtoolPosition;
