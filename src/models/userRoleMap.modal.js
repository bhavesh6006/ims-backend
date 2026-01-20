const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRoleMap = sequelize.define('UserRoleMap', {
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true
  }
}, {
  tableName: 'user_role_map',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['role_id'] }
  ]
});

module.exports = UserRoleMap;
