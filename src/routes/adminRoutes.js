const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');
const adminController = require('../controllers/adminController');
const sportsCenterController = require('../controllers/sportsCenterController');
const courtController = require('../controllers/courtController');
const usersController = require('../controllers/usersController');
const bookingsController = require('../controllers/bookingsController');
const academyController = require('../controllers/academyController');
const transactionController = require('../controllers/transactionController');


const { protect } = require('../middleware/userAuthMiddleware');





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

router.get('/sports-center/edit-sports-center/:id', authMiddleware, sportsCenterController.renderViewSportsCenter);
router.put('/sports-center/update-sports-center/:id', authMiddleware, sportsCenterController.update);


router.get('/manage-users/', authMiddleware, usersController.renderManageUsers);
router.get('/manage-user/:userid', authMiddleware, usersController.renderViewUser);



router.post('/sports-centers/create-court/:id', courtController.createCourt);
router.put('/sports-centers/update-court/:court_id', courtController.updateCourt);
router.delete('/sports-centers/delete-court/:court_id', courtController.deleteCourt);


router.get('/manage-transactions/', authMiddleware, transactionController.renderUserTransactions);




router.get('/bookings/', authMiddleware, bookingsController.renderAllBookings);


router.get('/academy/', authMiddleware, academyController.renderAllClasses);

router.post('/academy/create-class', authMiddleware, academyController.createAcademy);

router.post('/academy/upload-video', authMiddleware, academyController.uploadYoutubeTutorial);

router.post('/academy/create-coach', authMiddleware, academyController.createCoach);








module.exports = router;