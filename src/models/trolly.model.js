const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trolly = sequelize.define('Trolly', {
  trolley_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trolley_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Trolley Code'
  },
  trolly_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'trolly_type',
      key: 'trolly_type_id'
    },
    comment: 'Foreign key reference to trolly_type'
  },
  trolley_condition_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'trolley_condition',
      key: 'trolley_condition_id'
    },
    comment: 'Foreign key reference to trolley_condition'
  },
  trolley_image: {
    type: DataTypes.TEXT,
    comment: 'Image in base64 format for trolley'
  },
  barcode: {
    type: DataTypes.STRING(100),
    unique: true,
    comment: 'Barcode identifier'
  },
  qr_code: {
    type: DataTypes.STRING(200),
    unique: true,
    comment: 'QR code identifier'
  },
  length_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Length in cm'
  },
  width_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Width in cm'
  },
  height_mm: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Height in cm'
  },
  dimension_unit: {
    type: DataTypes.STRING(10),
    defaultValue: 'mm',
    comment: 'Unit for dimensions (mm, cm, m)'
  },
  volume_mm3: {
    type: DataTypes.DECIMAL(15, 2),
    comment: 'Volume in cubic cm'
  },
  volume_unit: {
    type: DataTypes.STRING(10),
    defaultValue: 'mm³',
    comment: 'Unit for volume (mm³, cm³, m³)'
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'Additional notes or remarks'
  },
  ownership: {
    type: DataTypes.STRING(100),
    comment: 'Ownership information'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE'
  },
  is_occupied: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	},
}, {
  tableName: 'trolley',
  indexes: [
    { fields: ['trolley_id'] },
    { fields: ['trolley_code'] },
    { fields: ['trolly_type_id'] }
  ]
});

// Association with TrollyType
Trolly.associate = (models) => {
  Trolly.belongsTo(models.TrollyType, {
    foreignKey: 'trolly_type_id',
    as: 'trollyType'
  });
};

module.exports = Trolly;