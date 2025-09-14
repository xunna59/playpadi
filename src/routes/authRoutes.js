const express = require('express');
const passport = require('../config/passport');
const UsersController = require('../controllers/usersController');
const { protect } = require('../middleware/userAuthMiddleware');


const router = express.Router();

// Regular auth endpoints
router.post('/register', UsersController.register);
router.post('/login', UsersController.login);

router.post('/validate-email', UsersController.checkEmailExists);


router.post('/resend-email-verification', protect, UsersController.resendVerificationEmail);
router.post('/forgot-password', UsersController.requestPasswordReset);
router.get('/reset-password', UsersController.resetPassword);





// Google OAuth: Initiate authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// Google OAuth callback
router.post('/google-auth', UsersController.googleAuthenticate);

// Apple OAuth: Initiate authentication
router.get('/apple', passport.authenticate('apple', { scope: ['email', 'name'] }));
// Apple OAuth callback
router.get('/apple/callback', UsersController.appleAuthCallback);

module.exports = router;
