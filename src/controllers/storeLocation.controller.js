const { StoreLocation, Antenna, StoreLocationAntenna } = require('../models');
const sequelize = require('../config/database');

class StoreLocationController {
  async getAllStoreLocations(req, res) {
    try {
      const locations = await StoreLocation.findAll({
        // where: { status: 'ACTIVE' },
        order: [['created_at', 'DESC']],
        include: [
          { model: StoreLocationAntenna, as: 'antennaMappings', where: { status: 'ACTIVE' }, required: false, include: [{ model: Antenna, as: 'antenna' }] }
        ]
      });
      res.status(200).json({ success: true, count: locations.length, data: locations });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch store locations', error: error.message });
    }
  }

  async getStoreLocationById(req, res) {
    try {
      const location = await StoreLocation.findOne({
        where: { store_location_id: req.params.id, status: 'ACTIVE' },
        include: [
          { model: StoreLocationAntenna, as: 'antennaMappings', where: { status: 'ACTIVE' }, required: false, include: [{ model: Antenna, as: 'antenna' }] }
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
      const { store_code, store_name, factory_name, plant_name, hierarchy_level, total_area, area_unit, remarks, status, antenna_mappings } = req.body;
      if (!store_code) return res.status(400).json({ success: false, message: 'store_code is required' });

      const existing = await StoreLocation.findOne({ where: { store_code }, transaction });
      if (existing) {
        await transaction.rollback();
        return res.status(409).json({ success: false, message: 'Store code already exists' });
      }

      const location = await StoreLocation.create({ store_code, store_name, factory_name, plant_name, hierarchy_level, total_area, area_unit, remarks, status: status || 'ACTIVE' }, { transaction });

      // Handle multiple antenna mappings if provided: array of { antenna_id, movement_type }
      const createdMappings = [];
      if (Array.isArray(antenna_mappings) && antenna_mappings.length > 0) {
        for (const m of antenna_mappings) {
          if (!m.antenna_id || !m.movement_type) continue;
          const ant = await Antenna.findOne({ where: { antenna_id: m.antenna_id, status: 'ACTIVE' }, transaction });
          if (!ant) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: `Antenna ${m.antenna_id} not found or inactive` });
          }

          const mapping = await StoreLocationAntenna.create({ store_location_id: location.store_location_id, antenna_id: m.antenna_id, movement_type: m.movement_type, status: 'ACTIVE' }, { transaction });
          createdMappings.push(mapping);
        }
      }

      await transaction.commit();
      const result = await StoreLocation.findOne({ where: { store_location_id: location.store_location_id }, include: [{ model: StoreLocationAntenna, as: 'antennaMappings', include: [{ model: Antenna, as: 'antenna' }] }] });
      res.status(201).json({ success: true, message: 'Store location created', data: result });
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

      const { antenna_mappings_to_add, antenna_mappings_to_remove, antenna_mappings_to_update } = req.body;

      // Update base location fields
      await location.update(req.body, { transaction });

      // Remove mappings (hard delete) by mapping_id array
      if (Array.isArray(antenna_mappings_to_remove) && antenna_mappings_to_remove.length > 0) {
        await StoreLocationAntenna.destroy({ where: { mapping_id: antenna_mappings_to_remove }, transaction });
      }

      // Update mappings
      if (Array.isArray(antenna_mappings_to_update) && antenna_mappings_to_update.length > 0) {
        for (const m of antenna_mappings_to_update) {
          const updateData = {};
          if (m.movement_type) updateData.movement_type = m.movement_type;
          if (m.antenna_id) updateData.antenna_id = m.antenna_id;
          if (Object.keys(updateData).length > 0) {
            await StoreLocationAntenna.update(updateData, { where: { mapping_id: m.mapping_id }, transaction });
          }
        }
      }

      // Add new mappings
      if (Array.isArray(antenna_mappings_to_add) && antenna_mappings_to_add.length > 0) {
        for (const m of antenna_mappings_to_add) {
          if (!m.antenna_id || !m.movement_type) continue;
          const ant = await Antenna.findOne({ where: { antenna_id: m.antenna_id, status: 'ACTIVE' }, transaction });
          if (!ant) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: `Antenna ${m.antenna_id} not found or inactive` });
          }
          await StoreLocationAntenna.create({ store_location_id: location.store_location_id, antenna_id: m.antenna_id, movement_type: m.movement_type, status: 'ACTIVE' }, { transaction });
        }
      }

      await transaction.commit();
      const updated = await StoreLocation.findOne({ where: { store_location_id: req.params.id }, include: [{ model: StoreLocationAntenna, as: 'antennaMappings', include: [{ model: Antenna, as: 'antenna' }] }] });
      res.status(200).json({ success: true, message: 'Store location updated', data: updated });
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

      // Delete associated antenna mappings first
      await StoreLocationAntenna.destroy({ where: { store_location_id: location.store_location_id }, transaction });
      
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
