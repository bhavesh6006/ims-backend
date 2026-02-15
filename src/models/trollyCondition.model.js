const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrollyCondition = sequelize.define('TrollyCondition', {
	trolley_condition_id: {
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4,
		primaryKey: true
	},
	name: {
		type: DataTypes.STRING(100),
		allowNull: false,
		unique: true,
		comment: 'Trolly condition name'
	},
	description: {
		type: DataTypes.STRING(150),
		comment: 'Trolly condition description'
	}
}, {
	tableName: 'trolley_condition',
	timestamps: false
});

module.exports = TrollyCondition;
