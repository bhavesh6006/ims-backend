const UserRole = require('../models/userRole.modal');

class UserRoleController {
    /**
     * Get all roles
     */
    async getAllRoles(req, res) {
        try {
            const roles = await UserRole.findAll({ order: [['role_name', 'ASC']] });
            res.status(200).json({ success: true, count: roles.length, data: roles });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to retrieve roles', error: error.message });
        }
    }

    /**
     * Create a new role
     */
    async createRole(req, res) {
        try {
            const { role_name } = req.body;
            if (!role_name) return res.status(400).json({ success: false, message: 'role_name is required' });

            const newRole = await UserRole.create({ role_name });
            res.status(201).json({ success: true, data: newRole });
        } catch (error) {
            // handle unique constraint on role_name
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ success: false, message: 'Role already exists' });
            }
            res.status(500).json({ success: false, message: 'Failed to create role', error: error.message });
        }
    }

    /**
     * Update role by id
     */
    async updateRole(req, res) {
        try {
            const { id } = req.params;
            const { role_name } = req.body;
            const role = await UserRole.findByPk(id);
            if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

            await role.update({ role_name });
            res.status(200).json({ success: true, data: role });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update role', error: error.message });
        }
    }

    /**
     * Delete role by id
     */
    async deleteRole(req, res) {
        try {
            const { id } = req.params;
            const role = await UserRole.findByPk(id);
            if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

            await role.destroy();
            res.status(200).json({ success: true, message: 'Role deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete role', error: error.message });
        }
    }
}

module.exports = new UserRoleController();