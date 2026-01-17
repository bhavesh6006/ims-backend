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
}

module.exports = new TrollyController();