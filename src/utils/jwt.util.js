const jwt = require('jsonwebtoken');

class JwtUtil {
	constructor() {
		this.secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
		this.expiresIn = process.env.JWT_EXPIRES_IN || '15m';
		this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '1h';
	}

	/**
	 * Generate access token
	 * @param {object} user - User object from database
	 * @returns {string} JWT token
	 */
	generateToken(user) {
		const payload = {
			user_id: user.user_id,
			username: user.username,
			email: user.email,
			role: user.role,
		};

		return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
	}

	/**
	 * Generate refresh token
	 * @param {object} user - User object from database
	 * @returns {string} JWT refresh token
	 */
	generateRefreshToken(user) {
		const payload = {
			user_id: user.user_id,
			username: user.username,
			type: 'refresh',
		};

		return jwt.sign(payload, this.secret, { expiresIn: this.refreshExpiresIn });
	}

	/**
	 * Verify and decode token
	 * @param {string} token 
	 * @returns {object} Decoded token payload
	 */
	verifyToken(token) {
		try {
			return jwt.verify(token, this.secret);
		} catch (error) {
			if (error.name === 'TokenExpiredError') {
				throw new Error('Token expired');
			}
			if (error.name === 'JsonWebTokenError') {
				throw new Error('Invalid token');
			}
			throw new Error('Token verification failed');
		}
	}

	/**
	 * Decode token without verification
	 * @param {string} token 
	 * @returns {object} Decoded token payload
	 */
	decodeToken(token) {
		return jwt.decode(token);
	}
}

module.exports = new JwtUtil();
