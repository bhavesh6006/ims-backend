const { LocationType } = require('../models');
const sequelize = require('../config/database');

class LocationTypeController {
  async getAllLocationTypes(req, res) {
    try {
      const locationTypes = await LocationType.findAll();
      res.status(200).json({ success: true, count: locationTypes.length, data: locationTypes });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch location types', error: error.message });
    }
  }

  async getLocationTypeById(req, res) {
    try {
      const locationType = await LocationType.findOne({ where: { location_type_id: req.params.id } });
      if (!locationType) return res.status(404).json({ success: false, message: 'Location type not found or inactive' });
      res.status(200).json({ success: true, data: locationType });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch location type', error: error.message });
    }
  }

  async createLocationType(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'name is required' });
      }

      const existing = await LocationType.findOne({ where: { name } });
      if (existing) return res.status(409).json({ success: false, message: 'Location type name already exists' });

      const locationType = await LocationType.create({ name, description });

      res.status(201).json({ success: true, message: 'Location type created', data: locationType });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create location type', error: error.message });
    }
  }

  async updateLocationType(req, res) {
    try {
      const locationType = await LocationType.findOne({ where: { location_type_id: req.params.id } });
      if (!locationType) return res.status(404).json({ success: false, message: 'Location type not found' });

      await locationType.update(req.body);
      const updated = await LocationType.findOne({ where: { location_type_id: req.params.id } });
      res.status(200).json({ success: true, message: 'Location type updated', data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update location type', error: error.message });
    }
  }

  async deleteLocationType(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const locationType = await LocationType.findOne({ where: { location_type_id: req.params.id }, transaction });
      if (!locationType) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Location type not found' });
      }

      // Delete the location type
      await locationType.destroy({ transaction });

      await transaction.commit();
      res.status(200).json({ success: true, message: 'Location type deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: 'Failed to delete location type', error: error.message });
    }
  }
}

module.exports = new LocationTypeController();
