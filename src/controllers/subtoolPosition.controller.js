const SubtoolPosition = require('../models/subtoolPosition.model');

class SubtoolPositionController {
  /**
   * Get all subtool positions
   */
  async getAllSubtoolPositions(req, res) {
    try {
      const subtoolPositions = await SubtoolPosition.findAll({
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        count: subtoolPositions.length,
        data: subtoolPositions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subtool positions',
        error: error.message
      });
    }
  }

  /**
   * Get subtool position by ID
   */
  async getSubtoolPositionById(req, res) {
    try {
      const subtoolPosition = await SubtoolPosition.findOne({
        where: { subtool_position_id: req.params.id }
      });

      if (!subtoolPosition) {
        return res.status(404).json({
          success: false,
          message: 'Subtool position not found'
        });
      }

      res.status(200).json({
        success: true,
        data: subtoolPosition
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subtool position',
        error: error.message
      });
    }
  }

  /**
   * Create new subtool position
   */
  async createSubtoolPosition(req, res) {
    try {
      const subtoolPosition = await SubtoolPosition.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Subtool position created successfully',
        data: subtoolPosition
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create subtool position',
        error: error.message
      });
    }
  }

  /**
   * Update subtool position
   */
  async updateSubtoolPosition(req, res) {
    try {
      const subtoolPosition = await SubtoolPosition.findOne({
        where: { subtool_position_id: req.params.id }
      });

      if (!subtoolPosition) {
        return res.status(404).json({
          success: false,
          message: 'Subtool position not found'
        });
      }

      await subtoolPosition.update(req.body);

      res.status(200).json({
        success: true,
        message: 'Subtool position updated successfully',
        data: subtoolPosition
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update subtool position',
        error: error.message
      });
    }
  }

  /**
   * Delete subtool position
   */
  async deleteSubtoolPosition(req, res) {
    try {
      const subtoolPosition = await SubtoolPosition.findOne({
        where: { subtool_position_id: req.params.id }
      });

      if (!subtoolPosition) {
        return res.status(404).json({
          success: false,
          message: 'Subtool position not found'
        });
      }

      await subtoolPosition.destroy();

      res.status(200).json({
        success: true,
        message: 'Subtool position deleted successfully',
        data: subtoolPosition
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete subtool position',
        error: error.message
      });
    }
  }
}

module.exports = new SubtoolPositionController();
