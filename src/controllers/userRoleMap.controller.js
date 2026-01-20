const UserRoleMap = require('../models/userRoleMap.modal');
const User = require('../models/user.modal');
const UserRole = require('../models/userRole.modal');

class UserRoleMapController {
  // List all mappings
  async getAllMappings(req, res) {
    try {
      const mappings = await UserRoleMap.findAll();
      res.status(200).json({ success: true, count: mappings.length, data: mappings });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve mappings', error: error.message });
    }
  }

  // Get roles for a user
  // Get mapping (single role) for a user
  async getMappingByUserId(req, res) {
    try {
      const { userId } = req.params;
      const mapping = await UserRoleMap.findOne({ where: { user_id: userId } });
      if (!mapping) return res.status(404).json({ success: false, message: 'Mapping not found for user' });

      const role = await UserRole.findByPk(mapping.role_id);
      res.status(200).json({ success: true, data: { user_id: userId, role } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve mapping for user', error: error.message });
    }
  }

  // Create mapping (user may have only one role)
  async createMapping(req, res) {
    try {
      const { user_id, role_id } = req.body;
      if (!user_id || !role_id) return res.status(400).json({ success: false, message: 'user_id and role_id are required' });

      // validate user and role exist
      const user = await User.findByPk(user_id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      const role = await UserRole.findByPk(role_id);
      if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

      const existing = await UserRoleMap.findOne({ where: { user_id } });
      if (existing) return res.status(409).json({ success: false, message: 'User already has a role' });

      const mapping = await UserRoleMap.create({ user_id, role_id });
      res.status(201).json({ success: true, data: mapping });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create mapping', error: error.message });
    }
  }

  // Delete mapping by user id
  async deleteMappingByUserId(req, res) {
    try {
      const { userId } = req.params;
      const mapping = await UserRoleMap.findOne({ where: { user_id: userId } });
      if (!mapping) return res.status(404).json({ success: false, message: 'Mapping not found' });

      await mapping.destroy();
      res.status(200).json({ success: true, message: 'Mapping deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete mapping', error: error.message });
    }
  }

  // Update mappings for a user (replace user's roles)
  // Update mapping (replace role for a user)
  async updateMapping(req, res) {
    const sequelize = require('../config/database');
    const t = await sequelize.transaction();
    try {
      const { userId } = req.params;
      const { role_id } = req.body; // expect single role_id

      if (!role_id) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'role_id is required' });
      }

      // validate role exists
      const role = await UserRole.findByPk(role_id);
      if (!role) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      // remove existing mapping for user
      await UserRoleMap.destroy({ where: { user_id: userId }, transaction: t });

      // create new mapping
      await UserRoleMap.create({ user_id: userId, role_id }, { transaction: t });

      await t.commit();
      res.status(200).json({ success: true, message: 'Mapping updated' });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ success: false, message: 'Failed to update mapping', error: error.message });
    }
  }
}

module.exports = new UserRoleMapController();
