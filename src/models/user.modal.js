const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
	user_id: {
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4,
		primaryKey: true
	},
	username: {
		type: DataTypes.STRING(100),
		allowNull: false,
		unique: true,
		comment: 'Username'
	},
	email: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: 'Email address'
	},
	role: {
		type: DataTypes.STRING(50),
		allowNull: false,
		validate: {
			isIn: [['Admin', 'StoreManager', 'Operator']]
		},
		comment: 'User role'
	},
	status: {
		type: DataTypes.STRING(20),
		defaultValue: 'ACTIVE',
		validate: {
			isIn: [['ACTIVE', 'INACTIVE']]
		},
		comment: 'User status'
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
	tableName: 'app_user',
	timestamps: false,
	indexes: [
		{ fields: ['user_id'] },
		{ fields: ['username'] },
		{ fields: ['email'] },
		{ fields: ['role'] },
		{ fields: ['status'] }
	]
});

module.exports = User;
