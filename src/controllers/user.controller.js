const User = require('../models/user.modal');

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
				whereClause.status = status;
			}
			if (username) whereClause.username = username;
			if (role) whereClause.role = role;

			const users = await User.findAll({
				where: whereClause,
				order: [['created_at', 'DESC']]
			});

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
			const validRoles = ['Admin', 'StoreManager', 'Operator'];
			if (!validRoles.includes(role)) {
				return res.status(400).json({ 
					success: false, 
					message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
				});
			}

			// validate email if provided
			if (email && !isValidEmail(email)) {
				return res.status(400).json({ success: false, message: 'Invalid email id' });
			}

			const newUser = await User.create({
				username,
				email,
				role,
				status: status || 'ACTIVE'
			});

			res.status(201).json({ success: true, data: newUser });
		} catch (error) {
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

			const user = await User.findByPk(id);
			if (!user) return res.status(404).json({ success: false, message: 'User not found' });

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

			await user.update({ username, email, role, status });
			res.status(200).json({ success: true, data: user });
		} catch (error) {
			res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
		}
	}

	/**
	 * Soft delete a user by id (set status = INACTIVE)
	 */
	async deleteUser(req, res) {
		try {
			const { id } = req.params;
			const user = await User.findByPk(id);
			if (!user) return res.status(404).json({ success: false, message: 'User not found' });

			await user.update({ status: 'INACTIVE' });
			res.status(200).json({ success: true, message: 'User soft-deleted' });
		} catch (error) {
			res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
		}
	}
}

module.exports = new UserController();

