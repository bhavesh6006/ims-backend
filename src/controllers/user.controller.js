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
			const { is_active, ldap_username } = req.query;
			const whereClause = {};

			if (typeof is_active !== 'undefined') {
				// accept true/false or 1/0
				const val = String(is_active).toLowerCase();
				whereClause.is_active = val === 'true' || val === '1';
			}
			if (ldap_username) whereClause.ldap_username = ldap_username;

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
			const { ldap_username, display_name, email, is_active } = req.body;
			if (!ldap_username) {
				return res.status(400).json({ success: false, message: 'ldap_username is required' });
			}

			// validate email if provided
			if (email && !isValidEmail(email)) {
				return res.status(400).json({ success: false, message: 'Invalid email id' });
			}

			const newUser = await User.create({
				ldap_username,
				display_name,
				email,
				// default true if not provided
				is_active: typeof is_active === 'undefined' ? true : is_active
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
			const { ldap_username, display_name, email, is_active } = req.body;

			const user = await User.findByPk(id);
			if (!user) return res.status(404).json({ success: false, message: 'User not found' });

			await user.update({ ldap_username, display_name, email, is_active });
			res.status(200).json({ success: true, data: user });
		} catch (error) {
			res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
		}
	}

	/**
	 * Soft delete a user by id (set is_active = false)
	 */
	async deleteUser(req, res) {
		try {
			const { id } = req.params;
			const user = await User.findByPk(id);
			if (!user) return res.status(404).json({ success: false, message: 'User not found' });

			await user.update({ is_active: false });
			res.status(200).json({ success: true, message: 'User soft-deleted' });
		} catch (error) {
			res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
		}
	}
}

module.exports = new UserController();

