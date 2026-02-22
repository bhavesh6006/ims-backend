const { Material, MaterialType, Subtool } = require('../models');

class MaterialController {
  /**
   * Get all materials
   */
  async getAllMaterials(req, res) {
    try {
      const { status, type, location } = req.query;
      const whereClause = {};

      if (status) whereClause.status = status;
      if (type) whereClause.material_type_id = type;
      if (location) whereClause.current_location_id = location;

      const materials = await Material.findAll({
        where: whereClause,
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

      res.status(200).json({
        success: true,
        count: materials.length,
        data: materials
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