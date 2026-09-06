const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

// Registration route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// reset password route
router.put('/restpassword', authController.resetPassword);

// Forgot password route
router.post('/forgotpassword', authController.forgotPassword);

// Get user informations
router.get('/user', authMiddleware.check, authController.user);

module.exports = router;