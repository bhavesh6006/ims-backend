const MaterialType = require('../models/materialType.model');

class MaterialTypeController {
  /**
   * Get all material types
   */
  async getAllMaterialTypes(req, res) {
    try {
      const materialTypes = await MaterialType.findAll({
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        count: materialTypes.length,
        data: materialTypes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve material types',
        error: error.message
      });
    }
  }

  /**
   * Get material type by ID
   */
  async getMaterialTypeById(req, res) {
    try {
      const materialType = await MaterialType.findOne({
        where: { material_type_id: req.params.id }
      });

      if (!materialType) {
        return res.status(404).json({
          success: false,
          message: 'Material type not found'
        });
      }

      res.status(200).json({
        success: true,
        data: materialType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve material type',
        error: error.message
      });
    }
  }

  /**
   * Create new material type
   */
  async createMaterialType(req, res) {
    try {
      const materialType = await MaterialType.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Material type created successfully',
        data: materialType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create material type',
        error: error.message
      });
    }
  }

  /**
   * Update material type
   */
  async updateMaterialType(req, res) {
    try {
      const materialType = await MaterialType.findOne({
        where: { material_type_id: req.params.id }
      });

      if (!materialType) {
        return res.status(404).json({
          success: false,
          message: 'Material type not found'
        });
      }

      await materialType.update(req.body);

      res.status(200).json({
        success: true,
        message: 'Material type updated successfully',
        data: materialType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update material type',
        error: error.message
      });
    }
  }

  /**
   * Delete material type
   */
  async deleteMaterialType(req, res) {
    try {
      const materialType = await MaterialType.findOne({
        where: { material_type_id: req.params.id }
      });

      if (!materialType) {
        return res.status(404).json({
          success: false,
          message: 'Material type not found'
        });
      }

      await materialType.destroy();

      res.status(200).json({
        success: true,
        message: 'Material type deleted successfully',
        data: materialType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete material type',
        error: error.message
      });
    }
  }
}

module.exports = new MaterialTypeController();
