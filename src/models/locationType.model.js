const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationType = sequelize.define('LocationType', {
	location_type_id: {
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4,
		primaryKey: true
	},
	name: {
		type: DataTypes.STRING(100),
		allowNull: false,
		unique: true,
		comment: 'Location type name'
	},
	description: {
		type: DataTypes.STRING(150),
		comment: 'Location type description'
	}
}, {
	tableName: 'location_type',
	timestamps: false
});

module.exports = LocationType;