const userService = require('../services/user.service');

// simple email validation
const isValidEmail = (email) => {
	if (!email) return false;
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(String(email).toLowerCase());
};

class UserController {
	/**
	 * Get all users
	 */
	async getAllUsers(req, res) {
		try {
			const { status, username, role } = req.query;
			const whereClause = {};

			if (status) {
				whereClause.is_active = status;
			}
			if (username) whereClause.username = username;
			if (role) whereClause.role = role;

			const users = await userService.getAll(whereClause);

			res.status(200).json({
				success: true,
				count: users.length,
				data: users
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: 'Failed to retrieve users',
				error: error.message
			});
		}
	}

	/**
	 * Create a new user
	 */
	async createUser(req, res) {
		try {
			const { username, email, role, status } = req.body;
			if (!username) {
				return res.status(400).json({ success: false, message: 'username is required' });
			}
			if (!role) {
				return res.status(400).json({ success: false, message: 'role is required' });
			}

			// Validate role
			const validRoles = ['Admin', 'Store Manager', 'Operator'];
			if (!validRoles.includes(role)) {
				return res.status(400).json({
					success: false,
					message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
				});
			}

			if (email && !isValidEmail(email)) {
				return res.status(400).json({ success: false, message: 'Invalid email id' });
			}

			const newUser = await userService.create({
				username,
				email,
				role,
				is_active: status ? true : false
			});

			res.status(201).json({ success: true, data: newUser });
		} catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return res.status(400).json({ success: false, message: 'Username already exists' });
			}
			res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
		}
	}

	/**
	 * Update an existing user by id
	 */
	async updateUser(req, res) {
		try {
			const { id } = req.params;
			const { username, email, role, status } = req.body;

			// Validate role if provided
			if (role) {
				const validRoles = ['Admin', 'StoreManager', 'Operator'];
				if (!validRoles.includes(role)) {
					return res.status(400).json({
						success: false,
						message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
					});
				}
			}

			// Validate email if provided
			if (email && !isValidEmail(email)) {
				return res.status(400).json({ success: false, message: 'Invalid email id' });
			}

			const user = await userService.update(id, { username, display_name: null, email, role, is_active: status });

			if (!user) {
				return res.status(404).json({ success: false, message: 'User not found' });
			}
			res.status(200).json({ success: true, data: user });
		} catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return res.status(400).json({ success: false, message: 'Username already exists' });
			}
			res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
		}
	}

	/**
	 * Permanently delete a user by id
	 */
	async deleteUser(req, res) {
		try {
			const { id } = req.params;
			const deleted = await userService.delete(id);

			if (!deleted) {
				return res.status(404).json({ success: false, message: 'User not found' });
			}
			res.status(200).json({ success: true, message: 'User deleted permanently' });
		} catch (error) {
			res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
		}
	}
}

module.exports = new UserController();

