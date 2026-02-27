const { StoreLocation, LocationType } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

class StoreLocationController {
  async getAllStoreLocations(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      // Parse pagination parameters
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const whereConditions = [];

      // Add search functionality
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        whereConditions.push({
          [Op.or]: [
            { store_code: { [Op.iLike]: searchTerm } },
            { store_name: { [Op.iLike]: searchTerm } },
            { factory_name: { [Op.iLike]: searchTerm } },
            { plant_name: { [Op.iLike]: searchTerm } },
            { hierarchy_level: { [Op.iLike]: searchTerm } }
          ]
        });
      }

      // Combine all conditions with AND
      const whereClause = whereConditions.length > 0 
        ? { [Op.and]: whereConditions }
        : {};

      // Get total count for pagination
      const totalCount = await StoreLocation.count({ where: whereClause });

      // Fetch paginated locations
      const locations = await StoreLocation.findAll({
        where: whereClause,
        limit: limitNum,
        offset: offset,
        order: [['created_at', 'DESC']],
        include: [
          { 
            model: LocationType, 
            as: 'locationType',
            attributes: ['location_type_id', 'name']
          }
        ]
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limitNum);

      res.status(200).json({ 
        success: true, 
        data: locations,
        count: totalCount,
        page: pageNum,
        pageSize: limitNum,
        totalPages: totalPages
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch store locations', error: error.message });
    }
  }

  async getStoreLocationById(req, res) {
    try {
      const location = await StoreLocation.findOne({
        where: { store_location_id: req.params.id, status: 'ACTIVE' },
        include: [
          { 
            model: LocationType, 
            as: 'locationType',
            attributes: ['location_type_id', 'name']
          }
        ]
      });
      if (!location) return res.status(404).json({ success: false, message: 'Store location not found or inactive' });
      res.status(200).json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch store location', error: error.message });
    }
  }

  async createStoreLocation(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { store_code, store_name, factory_name, plant_name, hierarchy_level, total_area, area_unit, remarks, status, location_type_id } = req.body;
      if (!store_code) return res.status(400).json({ success: false, message: 'store_code is required' });
      if (!location_type_id) return res.status(400).json({ success: false, message: 'location_type_id is required' });

      const existing = await StoreLocation.findOne({ where: { store_code }, transaction });
      if (existing) {
        await transaction.rollback();
        return res.status(409).json({ success: false, message: 'Store code already exists' });
      }

      const location = await StoreLocation.create({ store_code, store_name, factory_name, plant_name, hierarchy_level, total_area, area_unit, remarks, status: status || 'ACTIVE', location_type_id }, { transaction });

      await transaction.commit();
      res.status(201).json({ success: true, message: 'Store location created', data: location });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: 'Failed to create store location', error: error.message });
    }
  }

  async updateStoreLocation(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const location = await StoreLocation.findOne({ where: { store_location_id: req.params.id }, transaction });
      if (!location) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Store location not found' });
      }

      await location.update(req.body, { transaction });

      await transaction.commit();
      res.status(200).json({ success: true, message: 'Store location updated', data: location });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: 'Failed to update store location', error: error.message });
    }
  }

  async deleteStoreLocation(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const location = await StoreLocation.findOne({ where: { store_location_id: req.params.id }, transaction });
      if (!location) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Store location not found' });
      }

      // Delete the store location
      await location.destroy({ transaction });
      
      await transaction.commit();
      res.status(200).json({ success: true, message: 'Store location and its antenna mappings deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: 'Failed to delete store location', error: error.message });
    }
  }
}

module.exports = new StoreLocationController();
