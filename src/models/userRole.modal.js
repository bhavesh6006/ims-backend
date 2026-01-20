const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  role_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Role name'
  }
}, {
  tableName: 'app_role',
  timestamps: false,
  indexes: [
    { fields: ['role_id'] },
    { fields: ['role_name'] }
  ]
});

module.exports = UserRole;
