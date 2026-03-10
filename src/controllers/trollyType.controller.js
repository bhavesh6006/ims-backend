const { UniqueConstraintError, Op } = require('sequelize');
const TrollyType = require('../models/trollyType.model');

const getAllTrollyTypes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? { trolly_type: { [Op.iLike]: `%${search}%` } }
      : {};

    const { count, rows } = await TrollyType.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'ASC']],
      limit: Number(limit),
      offset: Number(offset),
    });
    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching trolly types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trolly types', error: error.message });
  }
};

const getTrollyTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await TrollyType.findByPk(id);
    if (!type) {
      return res.status(404).json({ success: false, message: 'Trolly type not found' });
    }
    res.status(200).json({ success: true, data: type });
  } catch (error) {
    console.error('Error fetching trolly type:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trolly type', error: error.message });
  }
};

const createTrollyType = async (req, res) => {
  try {
    const { trolly_type } = req.body;
    if (!trolly_type) {
      return res.status(400).json({ success: false, message: 'trolly_type is required' });
    }
    const newType = await TrollyType.create({ trolly_type });
    res.status(201).json({ success: true, message: 'Trolly type created successfully', data: newType });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ success: false, message: `Trolly type '${req.body.trolly_type?.toUpperCase().trim()}' already exists` });
    }
    console.error('Error creating trolly type:', error);
    res.status(500).json({ success: false, message: 'Failed to create trolly type', error: error.message });
  }
};

const updateTrollyType = async (req, res) => {
  try {
    const { id } = req.params;
    const { trolly_type } = req.body;
    const existing = await TrollyType.findByPk(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Trolly type not found' });
    }
    if (!trolly_type) {
      return res.status(400).json({ success: false, message: 'trolly_type is required' });
    }
    await existing.update({ trolly_type });
    res.status(200).json({ success: true, message: 'Trolly type updated successfully', data: existing });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ success: false, message: `Trolly type '${req.body.trolly_type?.toUpperCase().trim()}' already exists` });
    }
    console.error('Error updating trolly type:', error);
    res.status(500).json({ success: false, message: 'Failed to update trolly type', error: error.message });
  }
};

const deleteTrollyType = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await TrollyType.findByPk(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Trolly type not found' });
    }
    await existing.destroy();
    res.status(200).json({ success: true, message: 'Trolly type deleted successfully' });
  } catch (error) {
    console.error('Error deleting trolly type:', error);
    res.status(500).json({ success: false, message: 'Failed to delete trolly type', error: error.message });
  }
};

module.exports = {
  getAllTrollyTypes,
  getTrollyTypeById,
  createTrollyType,
  updateTrollyType,
  deleteTrollyType,
};
