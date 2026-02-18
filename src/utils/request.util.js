/**
 * Get client IP address from request
 * Handles proxies and load balancers
 */
function getClientIp(req) {
	// Check for IP in various headers (for proxies/load balancers)
	const forwarded = req.headers['x-forwarded-for'];
	if (forwarded) {
		// x-forwarded-for can contain multiple IPs, take the first one
		return forwarded.split(',')[0].trim();
	}

	const realIp = req.headers['x-real-ip'];
	if (realIp) {
		return realIp;
	}

	// Fallback to socket address
	return req.connection?.remoteAddress || 
	       req.socket?.remoteAddress || 
	       req.connection?.socket?.remoteAddress || 
	       'unknown';
}

/**
 * Get user agent from request headers
 */
function getUserAgent(req) {
	return req.headers['user-agent'] || 'unknown';
}

module.exports = {
	getClientIp,
	getUserAgent
};
