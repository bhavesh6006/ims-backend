const Trolly  = require('../models/trolly.model');
const TrollyType = require('../models/trollyType.model');
const TrollyCondition = require('../models/trollyCondition.model');
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
      if (type) whereClause.trolly_type_id = type;
      if (location) whereClause.current_location_id = location;

      const trollies = await Trolly.findAll({
        where: whereClause,
        raw: true,
        order: [['created_at', 'DESC']]
      });

      // Fetch trolly types and conditions and map them
      const transformedTrollies = await Promise.all(
        trollies.map(async (trolly) => {
          const trollyTypeData = await TrollyType.findOne({
            where: { trolly_type_id: trolly.trolly_type_id },
            raw: true
          });
          const trollyConditionData = await TrollyCondition.findOne({
            where: { trolley_condition_id: trolly.trolley_condition_id },
            raw: true
          });
          return {
            ...trolly,
            trolly_type: trollyTypeData ? trollyTypeData.trolly_type : null,
            trolly_condition: trollyConditionData ? trollyConditionData.name : null
          };
        })
      );

      res.status(200).json({
        success: true,
        count: transformedTrollies.length,
        data: transformedTrollies
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
        raw: true
      });

      if (!trolly) {
        return res.status(404).json({
          success: false,
          message: 'trolly not found'
        });
      }

      // Fetch trolly type and condition
        const trollyTypeData = await TrollyType.findOne({
        where: { trolly_type_id: trolly.trolly_type_id },
        raw: true
      });
      const trollyConditionData = await TrollyCondition.findOne({
        where: { trolley_condition_id: trolly.trolley_condition_id },
        raw: true
      });

      const transformedTrolly = {
        ...trolly,
        trolly_type: trollyTypeData ? trollyTypeData.trolly_type : null,
        trolly_condition: trollyConditionData ? trollyConditionData.name : null
      };

      res.status(200).json({
        success: true,
        data: transformedTrolly
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
      let trolly = await Trolly.findOne({
        where: { qr_code: req.params.trollyQRCode },
        raw: true
      });

      // If not found by qr_code, try barcode
      if (!trolly) {
        trolly = await Trolly.findOne({
          where: { barcode: req.params.trollyQRCode },
          raw: true
        });
      }

      if (!trolly) {
        return res.status(404).json({
          success: false,
          message: 'trolly not found'
        });
      }

      // Fetch trolly type and condition
      const trollyTypeData = await TrollyType.findOne({
        where: { trolly_type_id: trolly.trolly_type_id },
        raw: true
      });
      const trollyConditionData = await TrollyCondition.findOne({
        where: { trolley_condition_id: trolly.trolley_condition_id },
        raw: true
      });

      const transformedTrolly = {
        ...trolly,
        trolly_type: trollyTypeData ? trollyTypeData.trolly_type : null,
        trolly_condition: trollyConditionData ? trollyConditionData.name : null
      };

      res.status(200).json({
        success: true,
        data: transformedTrolly
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