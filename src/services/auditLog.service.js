const AuditLog = require('../models/auditLog.model');

class AuditLogService {
	/**
	 * Create an audit log entry
	 * @param {object} logData - Audit log data
	 * @returns {Promise<AuditLog>}
	 */
	async createLog(logData) {
		try {
			return await AuditLog.create(logData);
		} catch (error) {
			console.error('Failed to create audit log:', error);
			// Don't throw error to prevent audit logging from breaking the main flow
			return null;
		}
	}

	/**
	 * Log authentication attempt
	 * @param {object} params
	 * @returns {Promise<AuditLog>}
	 */
	async logAuth({ userId, username, action, status, ipAddress, userAgent, details, errorMessage }) {
		return this.createLog({
			user_id: userId || null,
			username,
			action,
			entity_type: 'AUTH',
			status,
			ip_address: ipAddress,
			user_agent: userAgent,
			details,
			error_message: errorMessage
		});
	}

	/**
	 * Log successful login
	 * @param {object} params
	 * @returns {Promise<AuditLog>}
	 */
	async logLoginSuccess({ userId, username, ipAddress, userAgent, details = {} }) {
		return this.logAuth({
			userId,
			username,
			action: 'LOGIN',
			status: 'SUCCESS',
			ipAddress,
			userAgent,
			details: {
				...details,
				timestamp: new Date().toISOString()
			}
		});
	}

	/**
	 * Log failed login
	 * @param {object} params
	 * @returns {Promise<AuditLog>}
	 */
	async logLoginFailure({ username, ipAddress, userAgent, reason, details = {} }) {
		return this.logAuth({
			username,
			action: 'LOGIN',
			status: 'FAILED',
			ipAddress,
			userAgent,
			details: {
				...details,
				reason,
				timestamp: new Date().toISOString()
			},
			errorMessage: reason
		});
	}

	/**
	 * Log logout
	 * @param {object} params
	 * @returns {Promise<AuditLog>}
	 */
	async logLogout({ userId, username, ipAddress, userAgent }) {
		return this.logAuth({
			userId,
			username,
			action: 'LOGOUT',
			status: 'SUCCESS',
			ipAddress,
			userAgent,
			details: {
				timestamp: new Date().toISOString()
			}
		});
	}

	/**
	 * Log token refresh
	 * @param {object} params
	 * @returns {Promise<AuditLog>}
	 */
	async logTokenRefresh({ userId, username, ipAddress, userAgent, status = 'SUCCESS', errorMessage }) {
		return this.logAuth({
			userId,
			username,
			action: 'TOKEN_REFRESH',
			status,
			ipAddress,
			userAgent,
			details: {
				timestamp: new Date().toISOString()
			},
			errorMessage
		});
	}

	/**
	 * Get audit logs with filters
	 * @param {object} filters
	 * @returns {Promise<AuditLog[]>}
	 */
	async getLogs(filters = {}) {
		const whereClause = {};

		if (filters.userId) whereClause.user_id = filters.userId;
		if (filters.username) whereClause.username = filters.username;
		if (filters.action) whereClause.action = filters.action;
		if (filters.status) whereClause.status = filters.status;
		if (filters.entityType) whereClause.entity_type = filters.entityType;

		const options = {
			where: whereClause,
			order: [['created_at', 'DESC']],
		};

		if (filters.limit) options.limit = parseInt(filters.limit);
		if (filters.offset) options.offset = parseInt(filters.offset);

		return await AuditLog.findAll(options);
	}

	/**
	 * Get audit logs count
	 * @param {object} filters
	 * @returns {Promise<number>}
	 */
	async getLogsCount(filters = {}) {
		const whereClause = {};

		if (filters.userId) whereClause.user_id = filters.userId;
		if (filters.username) whereClause.username = filters.username;
		if (filters.action) whereClause.action = filters.action;
		if (filters.status) whereClause.status = filters.status;

		return await AuditLog.count({ where: whereClause });
	}
}

module.exports = new AuditLogService();
