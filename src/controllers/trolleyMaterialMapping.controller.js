const { TrolleyMaterialMapping, TrollyType, Material, MaterialType } = require('../models');
const sequelize = require('../config/database');

// Create new mapping (one trolley type → multiple materials)
exports.createMapping = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { trolley_type_id, materials, effective_from, effective_to, notes, created_by } = req.body;

    // Validate required fields
    if (!trolley_type_id || !materials || !Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'trolley_type_id and materials array are required'
      });
    }

    // Validate each material entry
    for (const material of materials) {
      if (!material.material_id || !material.max_quantity) {
        return res.status(400).json({
          success: false,
          message: 'Each material must have material_id and max_quantity'
        });
      }
    }

    // Verify trolley type exists
    const trolleyType = await TrollyType.findByPk(trolley_type_id, { transaction });
    if (!trolleyType) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Trolley type not found'
      });
    }

    // Get current max version for this trolley type
    const maxVersionResult = await TrolleyMaterialMapping.findOne({
      where: { trolley_type_id },
      attributes: [[sequelize.fn('MAX', sequelize.col('version_no')), 'max_version']],
      transaction
    });
    const newVersion = (maxVersionResult?.dataValues?.max_version || 0) + 1;

    // Insert all material mappings
    const insertedMappings = [];
    for (const material of materials) {
      // Validate created_by is a valid UUID or null
      const validCreatedBy = created_by && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(created_by) 
        ? created_by 
        : null;

      const mapping = await TrolleyMaterialMapping.create({
        trolley_type_id,
        material_id: material.material_id,
        max_quantity: material.max_quantity,
        effective_from: effective_from || null,
        effective_to: effective_to || null,
        notes: notes || null,
        version_no: newVersion,
        created_by: validCreatedBy,
        status: 'ACTIVE'
      }, { transaction });
      insertedMappings.push(mapping);
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Trolley-material mapping created successfully',
      data: {
        version_no: newVersion,
        mappings: insertedMappings
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating trolley-material mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating mapping',
      error: error.message
    });
  }
};

// Edit mapping (add/remove materials from existing trolley type mapping)
exports.editMapping = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { trolleyTypeId } = req.params;
    const { materials_to_add, materials_to_remove, materials_to_update, updated_by } = req.body;

    // Verify trolley type exists
    const trolleyType = await TrollyType.findByPk(trolleyTypeId, { transaction });
    if (!trolleyType) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Trolley type not found'
      });
    }

    // Validate updated_by is a valid UUID or null
    const validUpdatedBy = updated_by && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updated_by) 
      ? updated_by 
      : null;

    // Get current max version
    const maxVersionResult = await TrolleyMaterialMapping.findOne({
      where: { trolley_type_id: trolleyTypeId },
      attributes: [[sequelize.fn('MAX', sequelize.col('version_no')), 'max_version']],
      transaction
    });
    const newVersion = (maxVersionResult?.dataValues?.max_version || 0) + 1;

    const results = {
      added: [],
      removed: [],
      updated: []
    };

    // Remove materials (soft delete)
    if (materials_to_remove && Array.isArray(materials_to_remove) && materials_to_remove.length > 0) {
      for (const materialId of materials_to_remove) {
        await TrolleyMaterialMapping.update(
          { status: 'INACTIVE', updated_by: validUpdatedBy },
          {
            where: {
              trolley_type_id: trolleyTypeId,
              material_id: materialId,
              status: 'ACTIVE'
            },
            transaction
          }
        );
        results.removed.push(materialId);
      }
    }

    // Update existing materials (max_quantity)
    if (materials_to_update && Array.isArray(materials_to_update) && materials_to_update.length > 0) {
      for (const material of materials_to_update) {
        const [updateCount, updatedRecords] = await TrolleyMaterialMapping.update(
          { max_quantity: material.max_quantity, updated_by: validUpdatedBy },
          {
            where: {
              trolley_type_id: trolleyTypeId,
              material_id: material.material_id,
              status: 'ACTIVE'
            },
            returning: true,
            transaction
          }
        );
        if (updateCount > 0) {
          results.updated.push(updatedRecords[0]);
        }
      }
    }

    // Add new materials
    if (materials_to_add && Array.isArray(materials_to_add) && materials_to_add.length > 0) {
      for (const material of materials_to_add) {
        // Check if mapping already exists and is active
        const existingMapping = await TrolleyMaterialMapping.findOne({
          where: {
            trolley_type_id: trolleyTypeId,
            material_id: material.material_id,
            status: 'ACTIVE'
          },
          transaction
        });

        if (existingMapping) {
          continue; // Skip if already exists
        }

        const newMapping = await TrolleyMaterialMapping.create({
          trolley_type_id: trolleyTypeId,
          material_id: material.material_id,
          max_quantity: material.max_quantity,
          version_no: newVersion,
          created_by: validUpdatedBy,
          status: 'ACTIVE'
        }, { transaction });
        results.added.push(newMapping);
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Trolley-material mapping updated successfully',
      data: results
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error editing trolley-material mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating mapping',
      error: error.message
    });
  }
};

// Get all mappings for a specific trolley type
exports.getMappingsByTrolleyType = async (req, res) => {
  try {
    const { trolleyTypeId } = req.params;

    const mappings = await TrolleyMaterialMapping.findAll({
      where: {
        trolley_type_id: trolleyTypeId,
        status: 'ACTIVE'
      },
      include: [
        {
          model: Material,
          as: 'material',
          attributes: ['material_id', 'material_code', 'material_name'],
          include: [{
            model: MaterialType,
            as: 'materialType',
            attributes: ['material_type_id', 'material_type']
          }]
        },
        {
          model: TrollyType,
          as: 'trolleyType',
          attributes: ['trolly_type_id', 'trolly_type']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: mappings
    });

  } catch (error) {
    console.error('Error fetching mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mappings',
      error: error.message
    });
  }
};

// Get single mapping by ID
exports.getMappingById = async (req, res) => {
  try {
    const { mappingId } = req.params;

    const mapping = await TrolleyMaterialMapping.findByPk(mappingId, {
      include: [
        {
          model: Material,
          as: 'material',
          attributes: ['material_id', 'material_code', 'material_name']
        },
        {
          model: TrollyType,
          as: 'trolleyType',
          attributes: ['trolly_type_id', 'trolly_type']
        }
      ]
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Mapping not found'
      });
    }

    res.status(200).json({
      success: true,
      data: mapping
    });

  } catch (error) {
    console.error('Error fetching mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mapping',
      error: error.message
    });
  }
};

// Get all active mappings
exports.getAllMappings = async (req, res) => {
  try {
    const mappings = await TrolleyMaterialMapping.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: Material,
          as: 'material',
          attributes: ['material_id', 'material_code', 'material_name'],
          include: [{
            model: MaterialType,
            as: 'materialType',
            attributes: ['material_type_id', 'material_type']
          }]
        },
        {
          model: TrollyType,
          as: 'trolleyType',
          attributes: ['trolly_type_id', 'trolly_type']
        }
      ],
      order: [
        [{ model: TrollyType, as: 'trolleyType' }, 'trolly_type', 'ASC'],
        [{ model: Material, as: 'material' }, 'material_code', 'ASC']
      ]
    });

    res.status(200).json({
      success: true,
      data: mappings
    });

  } catch (error) {
    console.error('Error fetching all mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mappings',
      error: error.message
    });
  }
};

// Delete mapping (soft delete)
exports.deleteMapping = async (req, res) => {
  try {
    const { mappingId } = req.params;

    const mapping = await TrolleyMaterialMapping.findByPk(mappingId);
    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Mapping not found'
      });
    }

    mapping.status = 'INACTIVE';
    await mapping.save();

    res.status(200).json({
      success: true,
      message: 'Mapping deleted successfully',
      data: mapping
    });

  } catch (error) {
    console.error('Error deleting mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting mapping',
      error: error.message
    });
  }
};
