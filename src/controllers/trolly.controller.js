const Trolly = require('../models/trolly.model');
const TrollyType = require('../models/trollyType.model');
const TrollyCondition = require('../models/trollyCondition.model');
const { Op } = require('sequelize');
// StoreLocation


class TrollyController {
  /**
   * Get all trollies with server-side pagination and search
   */
  async getAllTrollies(req, res) {
    try {
      const { status, type, location, page = 1, limit = 10, search = '' } = req.query;
      
      // Parse pagination parameters
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause for filters
      const whereConditions = [];

      if (status) whereConditions.push({ status: status });
      if (type) whereConditions.push({ trolly_type_id: type });
      if (location) whereConditions.push({ current_location_id: location });

      // Add search functionality
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        whereConditions.push({
          [Op.or]: [
            { trolley_code: { [Op.iLike]: searchTerm } },
            { qr_code: { [Op.iLike]: searchTerm } },
            { barcode: { [Op.iLike]: searchTerm } },
            { notes: { [Op.iLike]: searchTerm } },
            { ownership: { [Op.iLike]: searchTerm } }
          ]
        });
      }

      // Combine all conditions with AND
      const whereClause = whereConditions.length > 0 
        ? { [Op.and]: whereConditions }
        : {};

      // Get total count for pagination
      const totalCount = await Trolly.count({ where: whereClause });

      // Fetch paginated trollies
      const trollies = await Trolly.findAll({
        where: whereClause,
        limit: limitNum,
        offset: offset,
        order: [['created_at', 'DESC']],
        raw: true
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

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limitNum);

      res.status(200).json({
        success: true,
        data: transformedTrollies,
        count: totalCount,
        page: pageNum,
        pageSize: limitNum,
        totalPages: totalPages
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
        return res.status(400).json({
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
        return res.status(400).json({
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
      const trollyByCode = await Trolly.findOne({
        where: { trolley_code: req.body.trolley_code },
        raw: true
      });

      if (trollyByCode) {
        return res.status(400).json({
          success: false,
          message: 'Trolly with this code already exists'
        });
      }

      const trollyByQRCode = await Trolly.findOne({
        where: { qr_code: req.body.qr_code },
        raw: true
      });

      if (trollyByQRCode) {
        return res.status(400).json({
          success: false,
          message: 'Trolly with this QR code already exists'
        });
      }

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
      const trollyByCode = await Trolly.findOne({
        where: { trolley_code: req.body.trolley_code },
        raw: true
      });

      if (trollyByCode) {
        if (trollyByCode.trolley_id !== req.params.id) {
          return res.status(400).json({
            success: false,
            message: 'Trolly with this code already exists'
          });
        }
      }

      const trollyByQRCode = await Trolly.findOne({
        where: { qr_code: req.body.qr_code },
        raw: true
      });

      if (trollyByQRCode) {
        if (trollyByCode.trolley_id !== req.params.id) {
          return res.status(400).json({
            success: false,
            message: 'Trolly with this QR code already exists'
          });
        }
      }

      const trolly = await Trolly.findOne({ where: { trolley_id: req.params.id } });

      if (!trolly) {
        return res.status(400).json({
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
        return res.status(400).json({
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