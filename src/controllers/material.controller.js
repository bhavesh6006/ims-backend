const Material  = require('../models/material.model');
const MaterialType = require('../models/materialType.model');
const SubtoolPosition = require('../models/subtoolPosition.model');
// StoreLocation


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
        // include: [
        //   { model: MaterialType, as: 'materialType' },
        //   { model: SubtoolPosition, as: 'subtoolPosition' }
        // ],
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
        // include: [{ model: StoreLocation, as: 'currentLocation' }]
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
   * Create new material
   */
  async createMaterial(req, res) {
    try {
      const material = await Material.create(req.body);

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

      await material.update(req.body);

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