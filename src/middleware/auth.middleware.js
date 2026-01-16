/**
 * Authentication middleware
 * Checks if user is authenticated via LDAP session
 */
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
};

/**
 * Role-based authorization middleware
 * @param {Array<string>} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }
    
    return next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = authorize('admin');

/**
 * Check if user is store manager or admin
 */
const isStoreManager = authorize('admin', 'store_manager');

/**
 * Check if user is storekeeper, store manager, or admin
 */
const isStorekeeper = authorize('admin', 'store_manager', 'storekeeper');

/**
 * Check if user is operator or above
 */
const isOperator = authorize('admin', 'store_manager', 'storekeeper', 'operator');

module.exports = {
  isAuthenticated,
  authorize,
  isAdmin,
  isStoreManager,
  isStorekeeper,
  isOperator
};
