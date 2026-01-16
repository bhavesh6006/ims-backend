const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');

// Authentication routes
router.post('/login', authController.login);
router.post('/logout', isAuthenticated, authController.logout);
router.get('/me', isAuthenticated, authController.getCurrentUser);
router.get('/verify', authController.verifySession);

module.exports = router;
