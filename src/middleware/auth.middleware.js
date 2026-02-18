const jwtUtil = require('../utils/jwt.util');
const userService = require('../services/user.service');

class AuthMiddleware {
	/**
	 * Verify JWT token and attach user to request
	 */
	async authenticate(req, res, next) {
		try {
			const authHeader = req.headers.authorization;

			if (!authHeader || !authHeader.startsWith('Bearer ')) {
				return res.status(401).json({
					success: false,
					message: 'No token provided',
				});
			}

			const token = authHeader.substring(7);
			const decoded = jwtUtil.verifyToken(token);

			// Verify user still exists and is active
			const user = await userService.findActiveById(decoded.user_id);
			if (!user) {
				return res.status(403).json({
					success: false,
					message: 'User account is inactive or not found',
				});
			}

			// Attach user info to request
			req.user = decoded;
			next();
		} catch (error) {
			if (error.message === 'Token expired') {
				return res.status(401).json({
					success: false,
					message: 'Token expired',
					code: 'TOKEN_EXPIRED',
				});
			}

			return res.status(401).json({
				success: false,
				message: 'Invalid token',
			});
		}
	}

	/**
	 * Check if user has required role
	 * @param {string[]} roles - Array of allowed roles
	 */
	authorize(...roles) {
		return (req, res, next) => {
			if (!req.user) {
				return res.status(401).json({
					success: false,
					message: 'Unauthorized',
				});
			}

			if (roles.length && !roles.includes(req.user.role)) {
				return res.status(403).json({
					success: false,
					message: 'Insufficient permissions',
				});
			}

			next();
		};
	}
}

module.exports = new AuthMiddleware();
