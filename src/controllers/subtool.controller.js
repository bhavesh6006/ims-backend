const Subtool = require('../models/subtool.model');

class SubtoolController {
  /**
   * Get all subtools
   */
  async getAllSubtools(req, res) {
    try {
      const subtools = await Subtool.findAll({
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        count: subtools.length,
        data: subtools
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subtools',
        error: error.message
      });
    }
  }

  /**
   * Get subtool by ID
   */
  async getSubtoolById(req, res) {
    try {
      const subtool = await Subtool.findOne({
        where: { subtool_id: req.params.id }
      });

      if (!subtool) {
        return res.status(404).json({
          success: false,
          message: 'Subtool not found'
        });
      }

      res.status(200).json({
        success: true,
        data: subtool
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subtool',
        error: error.message
      });
    }
  }

  /**
   * Create new subtool
   */
  async createSubtool(req, res) {
    try {
      const subtool = await Subtool.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Subtool created successfully',
        data: subtool
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create subtool',
        error: error.message
      });
    }
  }

  /**
   * Update subtool
   */
  async updateSubtool(req, res) {
    try {
      const subtool = await Subtool.findOne({
        where: { subtool_id: req.params.id }
      });

      if (!subtool) {
        return res.status(404).json({
          success: false,
          message: 'Subtool not found'
        });
      }

      await subtool.update(req.body);

      res.status(200).json({
        success: true,
        message: 'Subtool updated successfully',
        data: subtool
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update subtool',
        error: error.message
      });
    }
  }

  /**
   * Delete subtool
   */
  async deleteSubtool(req, res) {
    try {
      const subtool = await Subtool.findOne({
        where: { subtool_id: req.params.id }
      });

      if (!subtool) {
        return res.status(404).json({
          success: false,
          message: 'Subtool not found'
        });
      }

      await subtool.destroy();

      res.status(200).json({
        success: true,
        message: 'Subtool deleted successfully',
        data: subtool
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete subtool',
        error: error.message
      });
    }
  }
}

module.exports = new SubtoolController();
