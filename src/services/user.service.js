const User = require('../models/user.modal');

class UserService {
	/**
	 * Find user by username
	 * @param {string} username 
	 * @param {boolean} activeOnly - Only return active users
	 * @returns {Promise<User|null>}
	 */
	async findByUsername(username, activeOnly = false) {
		const whereClause = { username };
		if (activeOnly) {
			whereClause.is_active = true;
		}
		return await User.findOne({ where: whereClause });
	}

	/**
	 * Find user by ID
	 * @param {string} userId 
	 * @returns {Promise<User|null>}
	 */
	async findById(userId) {
		return await User.findByPk(userId);
	}

	/**
	 * Find active user by ID
	 * @param {string} userId 
	 * @returns {Promise<User|null>}
	 */
	async findActiveById(userId) {
		return await User.findOne({
			where: { id: userId, is_active: true }
		});
	}

	/**
	 * Get all users with optional filters
	 * @param {object} filters 
	 * @returns {Promise<User[]>}
	 */
	async getAll(filters = {}) {
		const whereClause = {};

		if (typeof filters.is_active !== 'undefined') {
			whereClause.is_active = filters.is_active;
		}
		if (filters.username) {
			whereClause.username = filters.username;
		}

		return await User.findAll({
			where: whereClause,
			order: [['created_at', 'DESC']]
		});
	}

	/**
	 * Create a new user
	 * @param {object} userData 
	 * @returns {Promise<User>}
	 */
	async create(userData) {
		return await User.create(userData);
	}

	/**
	 * Update user
	 * @param {string} userId 
	 * @param {object} updateData 
	 * @returns {Promise<User|null>}
	 */
	async update(userId, updateData) {
		const user = await User.findByPk(userId);
		if (!user) return null;
		
		await user.update(updateData);
		return user;
	}

	/**
	 * Soft delete user (set is_active = false)
	 * @param {string} userId 
	 * @returns {Promise<boolean>}
	 */
	async softDelete(userId) {
		const user = await User.findByPk(userId);
		if (!user) return false;
		
		await user.update({ is_active: false });
		return true;
	}

	/**
	 * Permanently delete user from database
	 * @param {string} userId 
	 * @returns {Promise<boolean>}
	 */
	async delete(userId) {
		const user = await User.findByPk(userId);
		if (!user) return false;
		
		await user.destroy();
		return true;
	}
}

module.exports = new UserService();
