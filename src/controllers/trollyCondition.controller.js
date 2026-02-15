const { TrollyCondition, StoreLocationAntenna } = require('../models');
const sequelize = require('../config/database');

class TrollyConditionController {
  async getAllTrollyConditions(req, res) {
    try {
      const trollyConditions = await TrollyCondition.findAll();
      res.status(200).json({ success: true, count: trollyConditions.length, data: trollyConditions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch trolly conditions', error: error.message });
    }
  }

  async getTrollyConditionById(req, res) {
    try {
      const trollyCondition = await TrollyCondition.findOne({ where: { trolley_condition_id: req.params.id } });
      if (!trollyCondition) return res.status(404).json({ success: false, message: 'Trolly condition not found or inactive' });
      res.status(200).json({ success: true, data: trollyCondition });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch trolly condition', error: error.message });
    }
  }

  async createTrollyCondition(req, res) {
    try {
      const { name, description, status } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'name is required' });
      }

      const existing = await TrollyCondition.findOne({ where: { name } });
      if (existing) return res.status(409).json({ success: false, message: 'Trolly condition name already exists' });

      const trollyCondition = await TrollyCondition.create({ name, description, status: status || 'ACTIVE' });

      res.status(201).json({ success: true, message: 'Trolly condition created', data: trollyCondition });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create trolly condition', error: error.message });
    }
  }

  async updateTrollyCondition(req, res) {
    try {
      const trollyCondition = await TrollyCondition.findOne({ where: { trolley_condition_id: req.params.id } });
      if (!trollyCondition) return res.status(404).json({ success: false, message: 'Trolly condition not found' });

      await trollyCondition.update(req.body);
      const updated = await TrollyCondition.findOne({ where: { trolley_condition_id: req.params.id } });
      res.status(200).json({ success: true, message: 'Trolly condition updated', data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update trolly condition', error: error.message });
    }
  }

  async deleteTrollyCondition(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const trollyCondition = await TrollyCondition.findOne({ where: { trolley_condition_id: req.params.id }, transaction });
      if (!trollyCondition) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Trolly condition not found' });
      }

      // Delete the trolley condition
      await trollyCondition.destroy({ transaction });

      await transaction.commit();
      res.status(200).json({ success: true, message: 'Trolly condition deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: 'Failed to delete trolly condition', error: error.message });
    }
  }
}

module.exports = new TrollyConditionController();
