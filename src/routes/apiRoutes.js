const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const sportsCenterContrer = require('../controllers/sportsCenterController');
const courtController = require('../controllers/courtController');
const bookingsController = require('../controllers/bookingsController');
const { protect } = require('../middleware/userAuthMiddleware');
const UsersController = require('../controllers/usersController');



// api end points

// Get all sports centers

router.get('/fetch-sports-centers', sportsCenterContrer.apiAllSportsCenters);

router.get('/fetch-sports-center/:id', sportsCenterContrer.apiViewSportsCenters);




// Get available slots for a sports center

router.get('/fetch-slots/:id', courtController.getSlots);

router.get('/fetch-slots/:id/court_slots', courtController.getCourtSlots);




// get slots by date as query param e.g sports-centers/1/slots_by_date?date=2025-03-27
router.get('/sports-centers/:id/slots_by_date', courtController.getSlotsForDate);


// Get available courts for a selected slot
// e.g GET /sports-centers/123/courts/10:30 AM
//e.g GET /sports-centers/123/courts/10:30 AM?date=2025-03-27

router.get('/sports-centers/:sportsCenterId/courts/:slot', courtController.getAvailableCourts);

router.post("/book-court/:courtId", param('courtId').isInt().withMessage('Court ID must be an integer'),
    protect, courtController.bookCourt);

router.get('/courts/:sportsCenterId', courtController.getCourtsBySportsCenter);


// user routes

router.get('/fetch-profile', protect, UsersController.getProfile);

router.put('/update-profile', protect, UsersController.updateProfile);




module.exports = router;