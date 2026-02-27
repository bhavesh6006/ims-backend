const { Material, MaterialType, Subtool } = require('../models');
const { Op } = require('sequelize');

class MaterialController {
  /**
   * Get all materials with server-side pagination and search
   */
  async getAllMaterials(req, res) {
    try {
      const { status, type, location, page = 1, limit = 10, search = '' } = req.query;
      
      // Parse pagination parameters
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause for filters
      const whereConditions = [];

      if (status) whereConditions.push({ status: status });
      if (type) whereConditions.push({ material_type_id: type });
      if (location) whereConditions.push({ current_location_id: location });

      // Add search functionality
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        whereConditions.push({
          [Op.or]: [
            { material_code: { [Op.iLike]: searchTerm } },
            { material_name: { [Op.iLike]: searchTerm } }
          ]
        });
      }

      // Combine all conditions with AND
      const whereClause = whereConditions.length > 0 
        ? { [Op.and]: whereConditions }
        : {};

      // Get total count for pagination
      const totalCount = await Material.count({ where: whereClause });

      // Fetch paginated materials
      const materials = await Material.findAll({
        where: whereClause,
        limit: limitNum,
        offset: offset,
        include: [
          { 
            model: MaterialType, 
            as: 'materialType',
            attributes: ['material_type_id', 'material_type']
          },
          {
            model: Subtool,
            as: 'subtool',
            attributes: ['subtool_id', 'name']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limitNum);

      res.status(200).json({
        success: true,
        data: materials,
        count: totalCount,
        page: pageNum,
        pageSize: limitNum,
        totalPages: totalPages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve materials',
        error: error.message
      });
    }
  }

  /**
   * Get material by ID
   */
  async getMaterialById(req, res) {
    try {
      const material = await Material.findOne({
        where: { material_id: req.params.id },
        include: [
          { 
            model: MaterialType, 
            as: 'materialType',
            attributes: ['material_type_id', 'material_type']
          },
          {
            model: Subtool,
            as: 'subtool',
            attributes: ['subtool_id', 'name']
          }
        ]
      });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'material not found'
        });
      }

      res.status(200).json({
        success: true,
        data: material
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve material',
        error: error.message
      });
    }
  }

  /**
   * Get material by material code
   */
  async getMaterialByCode(req, res) {
    try {
      const { materialCode } = req.params;

      const material = await Material.findOne({
        where: { material_code: materialCode },
        include: [
          { 
            model: MaterialType, 
            as: 'materialType',
            attributes: ['material_type_id', 'material_type']
          },
          {
            model: Subtool,
            as: 'subtool',
            attributes: ['subtool_id', 'name']
          }
        ]
      });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }

      res.status(200).json({
        success: true,
        data: material
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve material',
        error: error.message
      });
    }
  }

  /**
   * Create new material
   */
  async createMaterial(req, res) {
    try {
      const payload = { ...req.body };

      const existingmaterial = await Material.findOne({ where: { material_code: payload.material_code } });
      if (existingmaterial) {
        return res.status(400).json({
          success: false,
          message: 'Material with this code already exists'
        });
      }

      // Accept singular `subtool_id`; if an array was sent, take first element
      if (Array.isArray(payload.subtool_id)) {
        payload.subtool_id = payload.subtool_id.length ? payload.subtool_id[0] : null;
      }
      // Support `subtool` sent as array or object -> normalize to `subtool_id`
      if (Array.isArray(payload.subtool)) payload.subtool = payload.subtool.length ? payload.subtool[0] : null;
      if (!payload.subtool_id && payload.subtool) {
        if (typeof payload.subtool === 'object') {
          payload.subtool_id = payload.subtool.subtool_id || payload.subtool.id || null;
        } else {
          payload.subtool_id = payload.subtool;
        }
      }
      delete payload.subtool;

      const material = await Material.create(payload);

      res.status(201).json({
        success: true,
        message: 'material created successfully',
        data: material
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to create material',
        error: error.message
      });
    }
  }

  /**
   * Update material
   */
  async updateMaterial(req, res) {
    try {
      const material = await Material.findOne({ where: { material_id: req.params.id } });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }

      const existingmaterial = await Material.findOne({ where: { material_code: req.body.material_code } });
      if (existingmaterial && existingmaterial.material_id !== material.material_id) {
        return res.status(400).json({
          success: false,
          message: 'Material with this code already exists'
        });
      }

      const payload = { ...req.body };
      if (Array.isArray(payload.subtool_id)) {
        payload.subtool_id = payload.subtool_id.length ? payload.subtool_id[0] : null;
      }
      if (Array.isArray(payload.subtool)) payload.subtool = payload.subtool.length ? payload.subtool[0] : null;
      if (!payload.subtool_id && payload.subtool) {
        if (typeof payload.subtool === 'object') {
          payload.subtool_id = payload.subtool.subtool_id || payload.subtool.id || null;
        } else {
          payload.subtool_id = payload.subtool;
        }
      }
      delete payload.subtool;

      await material.update(payload);

      res.status(200).json({
        success: true,
        message: 'Material updated successfully',
        data: material
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to update material',
        error: error.message
      });
    }
  }

  /**
   * Delete material
   */
  async deleteMaterial(req, res) {
    try {
      const material = await Material.findOne({ where: { material_id: req.params.id } });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }

      await material.destroy();

      res.status(200).json({
        success: true,
        message: 'Material deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete material',
        error: error.message
      });
    }
  }
}

module.exports = new MaterialController();