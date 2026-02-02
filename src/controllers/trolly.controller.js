const Trolly  = require('../models/trolly.model');
// StoreLocation


class TrollyController {
  /**
   * Get all trollies
   */
  async getAllTrollies(req, res) {
    try {
      const { status, type, location } = req.query;
      const whereClause = {};

      if (status) whereClause.status = status;
      if (type) whereClause.trolly_type = type;
      if (location) whereClause.current_location_id = location;

      const trollies = await Trolly.findAll({
        where: whereClause,
        // include: [{ model: StoreLocation, as: 'currentLocation' }],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        count: trollies.length,
        data: trollies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trollies',
        error: error.message
      });
    }
  }

  /**
   * Get trolly by ID
   */
  async getTrollyById(req, res) {
    try {
      const trolly = await Trolly.findOne({
        where: { trolley_id: req.params.id },
        // include: [{ model: StoreLocation, as: 'currentLocation' }]
      });

      if (!trolly) {
        return res.status(404).json({
          success: false,
          message: 'trolly not found'
        });
      }

      res.status(200).json({
        success: true,
        data: trolly
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trolly',
        error: error.message
      });
    }
  }

  /**
   * Get trolly by Code
   */
  async getTrollyByCode(req, res) {
    try {
      const trolly = await Trolly.findOne({
        where: { trolley_code: req.params.trollyCode },
        // include: [{ model: StoreLocation, as: 'currentLocation' }]
      });

      if (!trolly) {
        return res.status(404).json({
          success: false,
          message: 'trolly not found'
        });
      }

      res.status(200).json({
        success: true,
        data: trolly
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trolly',
        error: error.message
      });
    }
  }

  /**
   * Create new trolly
   */
  async createTrolly(req, res) {
    try {
      const trolly = await Trolly.create(req.body);

      res.status(201).json({
        success: true,
        message: 'trolly created successfully',
        data: trolly
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to create trolly',
        error: error.message
      });
    }
  }

  /**
   * Update trolly
   */
  async updateTrolly(req, res) {
    try {
      const trolly = await Trolly.findOne({ where: { trolley_id: req.params.id } });

      if (!trolly) {
        return res.status(404).json({
          success: false,
          message: 'Trolly not found'
        });
      }

      await trolly.update(req.body);

      res.status(200).json({
        success: true,
        message: 'Trolly updated successfully',
        data: trolly
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to update trolly',
        error: error.message
      });
    }
  }

  /**
   * Delete trolly
   */
  async deleteTrolly(req, res) {
    try {
      const trolly = await Trolly.findOne({ where: { trolley_id: req.params.id } });

      if (!trolly) {
        return res.status(404).json({
          success: false,
          message: 'Trolly not found'
        });
      }

      await trolly.destroy();

      res.status(200).json({
        success: true,
        message: 'Trolly deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete trolly',
        error: error.message
      });
    }
  }
}

module.exports = new TrollyController();