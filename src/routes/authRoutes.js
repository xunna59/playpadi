const express = require('express');
const passport = require('../config/passport'); // Ensure this file configures your strategies
const UsersController = require('../controllers/usersController');

const router = express.Router();

// Regular auth endpoints
router.post('/register', UsersController.register);
router.post('/login', UsersController.login);

// Google OAuth: Initiate authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// Google OAuth callback
router.get('/google/callback', UsersController.googleAuthCallback);

// Apple OAuth: Initiate authentication
router.get('/apple', passport.authenticate('apple', { scope: ['email', 'name'] }));
// Apple OAuth callback
router.get('/apple/callback', UsersController.appleAuthCallback);

module.exports = router;
