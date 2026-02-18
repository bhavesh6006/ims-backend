const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
	log_id: {
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4,
		primaryKey: true
	},
	user_id: {
		type: DataTypes.UUID,
		allowNull: true,
		comment: 'Reference to user who performed the action'
	},
	username: {
		type: DataTypes.STRING(100),
		allowNull: false,
		comment: 'Username at the time of action'
	},
	action: {
		type: DataTypes.STRING(50),
		allowNull: false,
		comment: 'Action performed (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)'
	},
	entity_type: {
		type: DataTypes.STRING(50),
		allowNull: true,
		comment: 'Type of entity affected'
	},
	entity_id: {
		type: DataTypes.UUID,
		allowNull: true,
		comment: 'ID of affected entity'
	},
	status: {
		type: DataTypes.STRING(20),
		allowNull: false,
		comment: 'Status of action (SUCCESS, FAILED, ERROR)'
	},
	ip_address: {
		type: DataTypes.STRING(45),
		allowNull: true,
		comment: 'IP address of the request'
	},
	user_agent: {
		type: DataTypes.TEXT,
		allowNull: true,
		comment: 'Browser user agent string'
	},
	details: {
		type: DataTypes.JSONB,
		allowNull: true,
		comment: 'Additional details in JSON format'
	},
	error_message: {
		type: DataTypes.TEXT,
		allowNull: true,
		comment: 'Error message if action failed'
	},
	created_at: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW
	}
}, {
	tableName: 'audit_log',
	timestamps: false,
	indexes: [
		{ fields: ['user_id'] },
		{ fields: ['username'] },
		{ fields: ['action'] },
		{ fields: ['status'] },
		{ fields: ['created_at'] },
		{ fields: ['entity_type', 'entity_id'] }
	]
});

module.exports = AuditLog;
