const { Antenna } = require('../models');

class AntennaController {
  async getAllAntennas(req, res) {
    try {
      const antennas = await Antenna.findAll({ where: { status: 'ACTIVE' }, order: [['created_at', 'DESC']] });
      res.status(200).json({ success: true, count: antennas.length, data: antennas });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch antennas', error: error.message });
    }
  }

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
    try {
      const antenna = await Antenna.findOne({ where: { antenna_id: req.params.id } });
      if (!antenna) return res.status(404).json({ success: false, message: 'Antenna not found' });

      // Soft-delete: mark as INACTIVE
      await antenna.update({ status: 'INACTIVE' });
      const updated = await Antenna.findOne({ where: { antenna_id: req.params.id } });
      res.status(200).json({ success: true, message: 'Antenna marked INACTIVE', data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete antenna', error: error.message });
    }
  }
}

module.exports = new AntennaController();
