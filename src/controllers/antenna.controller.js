const { Antenna, StoreLocationAntenna } = require('../models');
const sequelize = require('../config/database');

class AntennaController {
  async getAllAntennas(req, res) {
    try {
      const antennas = await Antenna.findAll({ order: [['created_at', 'DESC']] });
      res.status(200).json({ success: true, count: antennas.length, data: antennas });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch antennas', error: error.message });
    }
  }

  async getUnmappedAntennas(req, res) {
    try {
      const antennas = await Antenna.findAll({
        include: [
          {
            model: StoreLocationAntenna,
            as: 'storeMappings',
            required: false // LEFT JOIN
          }
        ],
        where: {
          status: 'ACTIVE',
          '$storeMappings.antenna_id$': null  // No mapping exists
        }
      });

      return res.status(200).json({
        success: true,
        count: antennas.length,
        data: antennas
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  async getAntennaById(req, res) {
    try {
      const antenna = await Antenna.findOne({ where: { antenna_id: req.params.id, status: 'ACTIVE' } });
      if (!antenna) return res.status(404).json({ success: false, message: 'Antenna not found or inactive' });
      res.status(200).json({ success: true, data: antenna });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch antenna', error: error.message });
    }
  }

  async createAntenna(req, res) {
    try {
      const { antenna_code, antenna_name, antenna_type, frequency_range, gain_dbi, reader_id, reader_port, antenna_role, orientation, mounting_type, tx_power_dbm, coverage_desc, status, remarks } = req.body;

      if (!antenna_code || !antenna_type) {
        return res.status(400).json({ success: false, message: 'antenna_code and antenna_type are required' });
      }

      const existing = await Antenna.findOne({ where: { antenna_code } });
      if (existing) return res.status(409).json({ success: false, message: 'Antenna code already exists' });

      const antenna = await Antenna.create({ antenna_code, antenna_name, antenna_type, frequency_range, gain_dbi, reader_id, reader_port, antenna_role, orientation, mounting_type, tx_power_dbm, coverage_desc, status: status || 'ACTIVE', remarks });

      res.status(201).json({ success: true, message: 'Antenna created', data: antenna });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create antenna', error: error.message });
    }
  }

  async updateAntenna(req, res) {
    try {
      const antenna = await Antenna.findOne({ where: { antenna_id: req.params.id } });
      if (!antenna) return res.status(404).json({ success: false, message: 'Antenna not found' });

      await antenna.update(req.body);
      const updated = await Antenna.findOne({ where: { antenna_id: req.params.id } });
      res.status(200).json({ success: true, message: 'Antenna updated', data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update antenna', error: error.message });
    }
  }

  async deleteAntenna(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const antenna = await Antenna.findOne({ where: { antenna_id: req.params.id }, transaction });
      if (!antenna) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Antenna not found' });
      }

      // Delete associated store location mappings first
      await StoreLocationAntenna.destroy({ where: { antenna_id: antenna.antenna_id }, transaction });
      
      // Delete the antenna
      await antenna.destroy({ transaction });
      
      await transaction.commit();
      res.status(200).json({ success: true, message: 'Antenna and its store mappings deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: 'Failed to delete antenna', error: error.message });
    }
  }
}

module.exports = new AntennaController();
