const TrollyType = require('../models/trollyType.model');

class TrollyTypeController {
  /**
   * Get all trolly types
   */
  async getAllTrollyTypes(req, res) {
    try {
      const trollyTypes = await TrollyType.findAll({
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        count: trollyTypes.length,
        data: trollyTypes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trolly types',
        error: error.message
      });
    }
  }

  /**
   * Get trolly type by ID
   */
  async getTrollyTypeById(req, res) {
    try {
      const trollyType = await TrollyType.findOne({
        where: { trolly_type_id: req.params.id }
      });

      if (!trollyType) {
        return res.status(404).json({
          success: false,
          message: 'Trolly type not found'
        });
      }

      res.status(200).json({
        success: true,
        data: trollyType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trolly type',
        error: error.message
      });
    }
  }

  /**
   * Create new trolly type
   */
  async createTrollyType(req, res) {
    try {
      const trollyType = await TrollyType.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Trolly type created successfully',
        data: trollyType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create trolly type',
        error: error.message
      });
    }
  }

  /**
   * Update trolly type
   */
  async updateTrollyType(req, res) {
    try {
      const trollyType = await TrollyType.findOne({
        where: { trolly_type_id: req.params.id }
      });

      if (!trollyType) {
        return res.status(404).json({
          success: false,
          message: 'Trolly type not found'
        });
      }

      await trollyType.update(req.body);

      res.status(200).json({
        success: true,
        message: 'Trolly type updated successfully',
        data: trollyType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update trolly type',
        error: error.message
      });
    }
  }

  /**
   * Delete trolly type
   */
  async deleteTrollyType(req, res) {
    try {
      const trollyType = await TrollyType.findOne({
        where: { trolly_type_id: req.params.id }
      });

      if (!trollyType) {
        return res.status(404).json({
          success: false,
          message: 'Trolly type not found'
        });
      }

      await trollyType.destroy();

      res.status(200).json({
        success: true,
        message: 'Trolly type deleted successfully',
        data: trollyType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete trolly type',
        error: error.message
      });
    }
  }
}

module.exports = new TrollyTypeController();
