const { TrolleyMaterialMapping, TrollyType, Material, MaterialType } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Create new mapping (one trolley type → multiple materials, with optional groups)
exports.createMapping = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { trolley_type_id, materials, groups, effective_from, effective_to, notes, created_by } = req.body;

    // Validate required fields
    if (!trolley_type_id) {
      return res.status(400).json({
        success: false,
        message: 'trolley_type_id is required'
      });
    }

    // Must have at least materials or groups
    const hasMaterials = materials && Array.isArray(materials) && materials.length > 0;
    const hasGroups = groups && Array.isArray(groups) && groups.length > 0;

    if (!hasMaterials && !hasGroups) {
      return res.status(400).json({
        success: false,
        message: 'At least one individual material or group is required'
      });
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

    // Collect all material IDs to check for duplicates
    const allMaterialIds = [];
    if (hasMaterials) {
      for (const m of materials) {
        if (!m.material_id || !m.max_quantity) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Each individual material must have material_id and max_quantity'
          });
        }
        allMaterialIds.push(m.material_id);
      }
    }
    if (hasGroups) {
      for (const group of groups) {
        if (!group.material_ids || !Array.isArray(group.material_ids) || group.material_ids.length < 2) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Each group must have at least 2 material_ids'
          });
        }
        if (!group.group_total_quantity || group.group_total_quantity < 1) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Each group must have a group_total_quantity >= 1'
          });
        }
        for (const mid of group.material_ids) {
          allMaterialIds.push(mid);
        }
      }
    }

    // Check for duplicate material IDs across all mappings
    const uniqueMaterialIds = new Set(allMaterialIds);
    if (uniqueMaterialIds.size !== allMaterialIds.length) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A material cannot be used in multiple mappings (individual or group) for the same trolley type'
      });
    }

    // Check if any of these materials already have ACTIVE mappings for this trolley type
    const existingMappings = await TrolleyMaterialMapping.findAll({
      where: {
        trolley_type_id,
        material_id: { [Op.in]: Array.from(uniqueMaterialIds) },
        status: 'ACTIVE'
      },
      transaction
    });

    if (existingMappings.length > 0) {
      const existingMaterialIds = existingMappings.map(m => m.material_id);
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Materials already have active mappings for this trolley type: ${existingMaterialIds.join(', ')}`
      });
    }

    // Get current max version for this trolley type
    const maxVersionResult = await TrolleyMaterialMapping.findOne({
      where: { trolley_type_id },
      attributes: [[sequelize.fn('MAX', sequelize.col('version_no')), 'max_version']],
      transaction
    });
    const newVersion = (maxVersionResult?.dataValues?.max_version || 0) + 1;

    const validCreatedBy = created_by && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(created_by)
      ? created_by
      : null;

    const insertedMappings = [];

    // Insert individual (non-group) materials
    if (hasMaterials) {
      for (const material of materials) {
        const mapping = await TrolleyMaterialMapping.create({
          trolley_type_id,
          material_id: material.material_id,
          max_quantity: material.max_quantity,
          is_group_mapping: false,
          mapping_group_id: null,
          group_total_quantity: null,
          effective_from: effective_from || null,
          effective_to: effective_to || null,
          notes: notes || null,
          version_no: newVersion,
          created_by: validCreatedBy,
          status: 'ACTIVE'
        }, { transaction });
        insertedMappings.push(mapping);
      }
    }

    // Insert group materials
    if (hasGroups) {
      for (const group of groups) {
        const groupId = uuidv4();
        const memberCount = group.material_ids.length;
        const perMaterialQty = Math.floor(group.group_total_quantity / memberCount);

        for (const materialId of group.material_ids) {
          const mapping = await TrolleyMaterialMapping.create({
            trolley_type_id,
            material_id: materialId,
            max_quantity: perMaterialQty,
            is_group_mapping: true,
            mapping_group_id: groupId,
            group_total_quantity: group.group_total_quantity,
            effective_from: effective_from || null,
            effective_to: effective_to || null,
            notes: group.notes || notes || null,
            version_no: newVersion,
            created_by: validCreatedBy,
            status: 'ACTIVE'
          }, { transaction });
          insertedMappings.push(mapping);
        }
      }
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

// Edit mapping (add/remove materials and groups from existing trolley type mapping)
exports.editMapping = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { trolleyTypeId } = req.params;
    const { materials_to_add, materials_to_remove, materials_to_update, groups_to_add, groups_to_remove, groups_to_update, updated_by } = req.body;

    // Verify trolley type exists
    const trolleyType = await TrollyType.findByPk(trolleyTypeId, { transaction });
    if (!trolleyType) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Trolley type not found'
      });
    }

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
      updated: [],
      groups_added: [],
      groups_removed: [],
      groups_updated: []
    };

    // Remove individual materials (permanent delete)
    if (materials_to_remove && Array.isArray(materials_to_remove) && materials_to_remove.length > 0) {
      for (const materialId of materials_to_remove) {
        await TrolleyMaterialMapping.destroy({
          where: {
            trolley_type_id: trolleyTypeId,
            material_id: materialId,
            status: 'ACTIVE',
            is_group_mapping: false
          },
          transaction
        });
        results.removed.push(materialId);
      }
    }

    // Update existing individual materials (max_quantity)
    if (materials_to_update && Array.isArray(materials_to_update) && materials_to_update.length > 0) {
      for (const material of materials_to_update) {
        const [updateCount, updatedRecords] = await TrolleyMaterialMapping.update(
          { max_quantity: material.max_quantity, updated_by: validUpdatedBy },
          {
            where: {
              trolley_type_id: trolleyTypeId,
              material_id: material.material_id,
              status: 'ACTIVE',
              is_group_mapping: false
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

    // Add new individual materials
    if (materials_to_add && Array.isArray(materials_to_add) && materials_to_add.length > 0) {
      for (const material of materials_to_add) {
        // Check if mapping already exists and is active (individual or group)
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
          is_group_mapping: false,
          mapping_group_id: null,
          group_total_quantity: null,
          version_no: newVersion,
          created_by: validUpdatedBy,
          status: 'ACTIVE'
        }, { transaction });
        results.added.push(newMapping);
      }
    }

    // Remove entire groups (permanent delete all members by group_id)
    if (groups_to_remove && Array.isArray(groups_to_remove) && groups_to_remove.length > 0) {
      for (const groupId of groups_to_remove) {
        await TrolleyMaterialMapping.destroy({
          where: {
            trolley_type_id: trolleyTypeId,
            mapping_group_id: groupId,
            status: 'ACTIVE'
          },
          transaction
        });
        results.groups_removed.push(groupId);
      }
    }

    // Update existing groups (change group_total_quantity, recalculate per-material qty, and handle member changes)
    if (groups_to_update && Array.isArray(groups_to_update) && groups_to_update.length > 0) {
      for (const group of groups_to_update) {
        // Get current group members
        const groupMembers = await TrolleyMaterialMapping.findAll({
          where: {
            trolley_type_id: trolleyTypeId,
            mapping_group_id: group.mapping_group_id,
            status: 'ACTIVE'
          },
          transaction
        });

        if (groupMembers.length === 0) continue;

        const currentMaterialIds = groupMembers.map(m => m.material_id).sort();
        const newMaterialIds = (group.material_ids || currentMaterialIds).sort();

        const materialsChanged = 
          currentMaterialIds.length !== newMaterialIds.length ||
          currentMaterialIds.some((id, idx) => id !== newMaterialIds[idx]);

        const groupTotalQuantity = group.group_total_quantity || groupMembers[0].group_total_quantity;

        if (materialsChanged) {
          // Materials in the group have changed - delete old members and create new ones
          await TrolleyMaterialMapping.destroy({
            where: {
              trolley_type_id: trolleyTypeId,
              mapping_group_id: group.mapping_group_id,
              status: 'ACTIVE'
            },
            transaction
          });

          const memberCount = newMaterialIds.length;
          const perMaterialQty = Math.floor(groupTotalQuantity / memberCount);

          for (const materialId of newMaterialIds) {
            await TrolleyMaterialMapping.create({
              trolley_type_id: trolleyTypeId,
              material_id: materialId,
              max_quantity: perMaterialQty,
              is_group_mapping: true,
              mapping_group_id: group.mapping_group_id,
              group_total_quantity: groupTotalQuantity,
              version_no: newVersion,
              created_by: validUpdatedBy,
              status: 'ACTIVE'
            }, { transaction });
          }

          results.groups_updated.push(group.mapping_group_id);
        } else {
          // Only quantity changed - update in place
          const perMaterialQty = Math.floor(groupTotalQuantity / groupMembers.length);
          await TrolleyMaterialMapping.update(
            {
              group_total_quantity: groupTotalQuantity,
              max_quantity: perMaterialQty,
              updated_by: validUpdatedBy
            },
            {
              where: {
                trolley_type_id: trolleyTypeId,
                mapping_group_id: group.mapping_group_id,
                status: 'ACTIVE'
              },
              transaction
            }
          );
          results.groups_updated.push(group.mapping_group_id);
        }
      }
    }

    // Add new groups
    if (groups_to_add && Array.isArray(groups_to_add) && groups_to_add.length > 0) {
      for (const group of groups_to_add) {
        if (!group.material_ids || group.material_ids.length < 2 || !group.group_total_quantity) {
          continue;
        }

        // Check no material already has an active mapping
        const existingMappings = await TrolleyMaterialMapping.findAll({
          where: {
            trolley_type_id: trolleyTypeId,
            material_id: { [Op.in]: group.material_ids },
            status: 'ACTIVE'
          },
          transaction
        });

        if (existingMappings.length > 0) {
          continue; // Skip group if any material already mapped
        }

        const groupId = uuidv4();
        const memberCount = group.material_ids.length;
        const perMaterialQty = Math.floor(group.group_total_quantity / memberCount);

        for (const materialId of group.material_ids) {
          const newMapping = await TrolleyMaterialMapping.create({
            trolley_type_id: trolleyTypeId,
            material_id: materialId,
            max_quantity: perMaterialQty,
            is_group_mapping: true,
            mapping_group_id: groupId,
            group_total_quantity: group.group_total_quantity,
            version_no: newVersion,
            created_by: validUpdatedBy,
            status: 'ACTIVE'
          }, { transaction });
          results.groups_added.push(newMapping);
        }
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

    // Validate that mappingId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(mappingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mapping ID format. Must be a valid UUID.'
      });
    }

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
    const { page = 1, limit = 10, search = '' } = req.query;
    
    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for search
    const whereConditions = [{ status: 'ACTIVE' }];

    // Add search functionality - search in material code/name or trolley type
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push({
        [Op.or]: [
          { '$material.material_code$': { [Op.iLike]: searchTerm } },
          { '$material.material_name$': { [Op.iLike]: searchTerm } },
          { '$trolleyType.trolly_type$': { [Op.iLike]: searchTerm } }
        ]
      });
    }

    // Combine all conditions with AND
    const whereClause = { [Op.and]: whereConditions };

    // Get total count for pagination
    const totalCount = await TrolleyMaterialMapping.count({
      where: whereClause,
      include: [
        {
          model: Material,
          as: 'material',
          attributes: []
        },
        {
          model: TrollyType,
          as: 'trolleyType',
          attributes: []
        }
      ],
      distinct: true
    });

    // Fetch paginated mappings
    const mappings = await TrolleyMaterialMapping.findAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
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

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: mappings,
      count: totalCount,
      page: pageNum,
      pageSize: limitNum,
      totalPages: totalPages
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

// Get mapping by material_id and trolley_type_id
exports.getMappingByMaterialAndTrolleyType = async (req, res) => {
  try {
    const { material_id, trolley_type_id } = req.query;

    // Validate required parameters
    if (!material_id || !trolley_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Both material_id and trolley_type_id are required as query parameters'
      });
    }

    const mapping = await TrolleyMaterialMapping.findOne({
      where: {
        material_id: material_id,
        trolley_type_id: trolley_type_id,
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
      ]
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'No active mapping found for the given material and trolley type'
      });
    }

    // If this is a group mapping, also return group info
    let groupMappings = null;
    if (mapping.is_group_mapping && mapping.mapping_group_id) {
      groupMappings = await TrolleyMaterialMapping.findAll({
        where: {
          mapping_group_id: mapping.mapping_group_id,
          status: 'ACTIVE'
        },
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['material_id', 'material_code', 'material_name']
          }
        ],
        transaction: null
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...mapping.toJSON(),
        group_members: groupMappings ? groupMappings.map(gm => gm.toJSON()) : null
      }
    });

  } catch (error) {
    console.error('Error fetching mapping by material and trolley type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mapping',
      error: error.message
    });
  }
};

// Delete mapping (permanent delete)
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

    // If it's a group mapping, delete the entire group
    if (mapping.is_group_mapping && mapping.mapping_group_id) {
      await TrolleyMaterialMapping.destroy({
        where: {
          mapping_group_id: mapping.mapping_group_id
        }
      });
    } else {
      await mapping.destroy();
    }

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
