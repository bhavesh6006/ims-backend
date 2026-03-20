const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrolleyMaterialMapping = sequelize.define('TrolleyMaterialMapping', {
  mapping_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trolley_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'trolly_type',
      key: 'trolly_type_id'
    },
    comment: 'Foreign key reference to trolly_type'
  },
  material_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'material',
      key: 'material_id'
    },
    comment: 'Foreign key reference to material'
  },
  max_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    },
    comment: 'Maximum quantity of material allowed in this trolley type'
  },
  mapping_group_id: {
    type: DataTypes.UUID,
    allowNull: true,
    defaultValue: null,
    comment: 'UUID to identify a group of materials mapped together'
  },
  group_total_quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'Total quantity for the entire group, divided equally among group members'
  },
  is_group_mapping: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'TRUE if this mapping is part of a group'
  },
  effective_from: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Effective start date for this mapping'
  },
  effective_to: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Effective end date for this mapping'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes or remarks'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE'
  },
  version_no: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Version number for tracking mapping history'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'app_user',
      key: 'user_id'
    },
    comment: 'User who created this mapping'
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'app_user',
      key: 'user_id'
    },
    comment: 'User who last updated this mapping'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'trolley_material_mapping',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['trolley_type_id', 'material_id', 'version_no'],
      name: 'unique_trolley_material_version'
    },
    {
      fields: ['trolley_type_id'],
      name: 'idx_trolley_material_mapping_trolley_type'
    },
    {
      fields: ['material_id'],
      name: 'idx_trolley_material_mapping_material'
    },
    {
      fields: ['status'],
      name: 'idx_trolley_material_mapping_status'
    },
    {
      fields: ['version_no'],
      name: 'idx_trolley_material_mapping_version'
    }
  ]
});

module.exports = TrolleyMaterialMapping;
