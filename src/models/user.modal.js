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
		comment: 'username'
	},
	display_name: {
		type: DataTypes.STRING(150),
		comment: 'User display name'
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
			isIn: [['Admin', 'Store Manager', 'Operator']]
		},
		comment: 'User role'
	},
	is_active: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
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
