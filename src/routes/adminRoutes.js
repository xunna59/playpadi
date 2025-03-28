const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');
const adminController = require('../controllers/adminController');
const sportsCenterController = require('../controllers/sportsCenterController');
const courtController = require('../controllers/courtController');




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



// Get available slots for a sports center
router.get('/sports-centers/:id/slots', courtController.getCourtSlots);


// get slots by date as query param e.g sports-centers/1/slots_by_date?date=2025-03-27
router.get('/sports-centers/:id/slots_by_date', courtController.getSlotsForDate);


// Get available courts for a selected slot
// e.g GET /sports-centers/123/courts/10:30 AM
//e.g GET /sports-centers/123/courts/10:30 AM?date=2025-03-27

router.get('/sports-centers/:sportsCenterId/courts/:slot', courtController.getAvailableCourts);





module.exports = router;