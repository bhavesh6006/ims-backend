const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
	user_id: {
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4,
		primaryKey: true
	},
	ldap_username: {
		type: DataTypes.STRING(100),
		allowNull: false,
		unique: true,
		comment: 'LDAP username'
	},
	display_name: {
		type: DataTypes.STRING(150),
		comment: 'User display name'
	},
	email: {
		type: DataTypes.STRING(150),
		comment: 'Email address'
	},
	is_active: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	}
}, {
	tableName: 'app_user',
	timestamps: false,
	indexes: [
		{ fields: ['user_id'] },
		{ fields: ['ldap_username'] },
        { fields: ['email'] }
	]
});

module.exports = User;
