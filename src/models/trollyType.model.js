const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrollyType = sequelize.define('TrollyType', {
  trolly_type_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  trolly_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Trolly type already exists',
    },
    set(value) {
      this.setDataValue('trolly_type', value ? value.toUpperCase().trim() : value);
    },
  },
}, {
  tableName: 'trolly_type',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeValidate: (instance) => {
      if (instance.trolly_type) {
        instance.trolly_type = instance.trolly_type.toUpperCase().trim();
      }
    },
  },
});

module.exports = TrollyType;
