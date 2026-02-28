const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkOrderRefresh = sequelize.define('WorkOrderRefresh', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    last_refresh: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    failed_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'work_order_refresh',
    timestamps: false
  });
  return WorkOrderRefresh;
};
