const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');
const adminController = require('../controllers/adminController');
const sportsCenterController = require('../controllers/sportsCenterController');



router.get('/login', adminController.renderLogin);

router.post('/admin-login',

    body('email').isEmail().withMessage('Email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),

    adminController.loginAdmin
);

router.get('/logout', adminController.logout);


router.get('/dashboard', authMiddleware, dashboardController.renderDashboard);

router.get('/sports-center/', authMiddleware, sportsCenterController.renderAllSportsCenter);
router.get('/sports-center/add-sports-center', authMiddleware, sportsCenterController.renderAddSportsCenter);
router.post('/sports-center/create-sports-center', authMiddleware, sportsCenterController.create);



module.exports = router;