const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ldap_username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'LDAP username/uid'
  },
  ldap_dn: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'LDAP Distinguished Name'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  employee_id: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: 'Employee ID from LDAP'
  },
  role: {
    type: DataTypes.ENUM('admin', 'store_manager', 'storekeeper', 'operator'),
    allowNull: false,
    defaultValue: 'operator',
    comment: 'User role mapped from LDAP groups'
  },
  department: {
    type: DataTypes.STRING(100),
    comment: 'Department from LDAP'
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE
  },
  ldap_sync_at: {
    type: DataTypes.DATE,
    comment: 'Last LDAP synchronization timestamp'
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['ldap_username'] },
    { fields: ['employee_id'] },
    { fields: ['role'] }
  ]
});

// Instance method to get user without sensitive data
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.ldap_dn;
  return values;
};

module.exports = User;
