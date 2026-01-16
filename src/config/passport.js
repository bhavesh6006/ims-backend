const passport = require('passport');
const LdapStrategy = require('passport-ldapauth');
const { User } = require('../models');

// LDAP strategy configuration
const ldapOptions = {
  server: {
    url: process.env.LDAP_URL,
    bindDN: process.env.LDAP_BIND_DN,
    bindCredentials: process.env.LDAP_BIND_PASSWORD,
    searchBase: process.env.LDAP_SEARCH_BASE,
    searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
    searchAttributes: ['uid', 'cn', 'givenName', 'sn', 'mail', 'employeeNumber', 'department', 'memberOf'],
    reconnect: true
  }
};

// Map LDAP groups to application roles
const mapLdapGroupToRole = (memberOf) => {
  if (!memberOf) return 'operator';
  
  const groups = Array.isArray(memberOf) ? memberOf : [memberOf];
  
  // Check for admin group
  if (groups.some(group => group.includes(process.env.LDAP_GROUP_ADMIN))) {
    return 'admin';
  }
  
  // Check for store manager group
  if (groups.some(group => group.includes(process.env.LDAP_GROUP_STORE_MANAGER))) {
    return 'store_manager';
  }
  
  // Check for storekeeper group
  if (groups.some(group => group.includes(process.env.LDAP_GROUP_STOREKEEPER))) {
    return 'storekeeper';
  }
  
  // Check for operator group
  if (groups.some(group => group.includes(process.env.LDAP_GROUP_OPERATOR))) {
    return 'operator';
  }
  
  // Default to operator
  return 'operator';
};

// Configure LDAP strategy
passport.use(new LdapStrategy(ldapOptions, async (ldapUser, done) => {
  try {
    // Extract user information from LDAP
    const ldapUsername = ldapUser.uid || ldapUser.sAMAccountName;
    const email = ldapUser.mail;
    const firstName = ldapUser.givenName || ldapUser.cn?.split(' ')[0];
    const lastName = ldapUser.sn || ldapUser.cn?.split(' ').slice(1).join(' ');
    const employeeId = ldapUser.employeeNumber;
    const department = ldapUser.department;
    const memberOf = ldapUser.memberOf;
    const ldapDn = ldapUser.dn;
    
    // Map LDAP groups to application role
    const role = mapLdapGroupToRole(memberOf);
    
    // Find or create user in database
    let user = await User.findOne({ where: { ldap_username: ldapUsername } });
    
    if (user) {
      // Update existing user with latest LDAP data
      await user.update({
        ldap_dn: ldapDn,
        email: email || user.email,
        first_name: firstName || user.first_name,
        last_name: lastName || user.last_name,
        employee_id: employeeId || user.employee_id,
        role: role,
        department: department || user.department,
        last_login: new Date(),
        ldap_sync_at: new Date()
      });
    } else {
      // Create new user from LDAP data
      user = await User.create({
        ldap_username: ldapUsername,
        ldap_dn: ldapDn,
        email: email || `${ldapUsername}@company.com`,
        first_name: firstName || ldapUsername,
        last_name: lastName || '',
        employee_id: employeeId,
        role: role,
        department: department,
        is_active: true,
        last_login: new Date(),
        ldap_sync_at: new Date()
      });
    }
    
    return done(null, user);
  } catch (error) {
    console.error('LDAP authentication error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
