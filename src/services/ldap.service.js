const axios = require('axios');

const LDAP_API_URL = process.env.LDAP_API_URL;

/**
 * Authenticate user via external LDAP API
 * @param {string} username
 * @param {string} password
 * @returns {Promise<boolean>} true if authenticated
 * @throws {Error} on API/network errors
 */
const authenticate = async (username, password) => {
    if (!LDAP_API_URL) {
        throw new Error('LDAP_API_URL is not configured in environment variables');
    }

    try {
        const response = await axios.post(
            LDAP_API_URL,
            { username, password },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        const { status, code, message } = response.data;

        if (status === 'success' && code === 200) {
            return true;
        }

        if (code === 401) {
            return false;
        }

        if (code === 503) {
            throw new Error('LDAP server unreachable');
        }

        throw new Error(message || 'Authentication failed');
    } catch (error) {
        if (error.response) {
            const { status, code, message } = error.response.data || {};

            if (code === 401) {
                return false;
            }
            if (code === 503) {
                throw new Error('LDAP server unreachable');
            }
            if (code === 400) {
                throw new Error(message || 'Missing credentials');
            }

            throw new Error(message || 'Authentication API error');
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            throw new Error('LDAP authentication API is unreachable');
        }

        throw error;
    }
};

module.exports = { authenticate };
