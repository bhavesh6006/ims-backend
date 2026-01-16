const passport = require('../config/passport');
const { User } = require('../models');

class AuthController {
  /**
   * Login with LDAP credentials
   */
  async login(req, res, next) {
    passport.authenticate('ldapauth', (err, user, info) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Authentication server error',
          error: err.message
        });
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed',
          info: info?.message || 'Invalid credentials'
        });
      }
      
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'User account is inactive'
        });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Session creation failed',
            error: err.message
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.ldap_username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            department: user.department
          }
        });
      });
    })(req, res, next);
  }
  
  /**
   * Logout
   */
  async logout(req, res) {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Logout failed',
          error: err.message
        });
      }
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Session destruction failed'
          });
        }
        
        res.clearCookie('connect.sid');
        return res.status(200).json({
          success: true,
          message: 'Logout successful'
        });
      });
    });
  }
  
  /**
   * Get current authenticated user
   */
  async getCurrentUser(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.ldap_username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          employeeId: user.employee_id,
          role: user.role,
          department: user.department,
          lastLogin: user.last_login
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: error.message
      });
    }
  }
  
  /**
   * Verify session status
   */
  async verifySession(req, res) {
    if (req.isAuthenticated()) {
      return res.status(200).json({
        success: true,
        authenticated: true,
        user: {
          id: req.user.id,
          username: req.user.ldap_username,
          role: req.user.role
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: 'Not authenticated'
      });
    }
  }
}

module.exports = new AuthController();
