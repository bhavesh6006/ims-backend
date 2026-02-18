const ldap = require('ldapjs');

class LdapService {
	constructor() {
		this.ldapUrl = process.env.LDAP_URL || 'ldap://localhost:389';
		this.ldapBaseDn = process.env.LDAP_BASE_DN || 'dc=example,dc=com';
		this.ldapBindDn = process.env.LDAP_BIND_DN || '';
		this.ldapBindPassword = process.env.LDAP_BIND_PASSWORD || '';
		this.ldapTimeout = 15000; // 15 seconds
	}

	/**
	 * Authenticate user against LDAP server
	 * @param {string} username 
	 * @param {string} password 
	 * @returns {Promise<boolean>}
	 */
	async authenticate(username, password) {
		return new Promise((resolve, reject) => {
			const client = ldap.createClient({
				url: this.ldapUrl,
				timeout: this.ldapTimeout,
				connectTimeout: this.ldapTimeout,
			});

			const userDn = `uid=${username},${this.ldapBaseDn}`;

			client.bind(userDn, password, (err) => {
				if (err) {
					client.unbind();
					if (err.name === 'InvalidCredentialsError') {
						return resolve(false);
					}
					return reject(new Error(`LDAP authentication failed: ${err.message}`));
				}

				client.unbind();
				resolve(true);
			});

			client.on('error', (err) => {
				reject(new Error(`LDAP connection error: ${err.message}`));
			});

			client.on('timeout', () => {
				client.unbind();
				reject(new Error('LDAP connection timeout'));
			});
		});
	}
}

module.exports = new LdapService();
