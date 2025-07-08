const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const sportsCenterContrer = require('../controllers/sportsCenterController');
const courtController = require('../controllers/courtController');
const bookingsController = require('../controllers/bookingsController');
const { protect } = require('../middleware/userAuthMiddleware');
const UsersController = require('../controllers/usersController');
const academyController = require('../controllers/academyController');
const faqController = require('../controllers/faqController');
const notificationController = require('../controllers/notificationController');
const paymentController = require('../controllers/paymentController');
const transactionController = require('../controllers/transactionController');




// api end points

// Get all sports centers

router.get('/fetch-sports-centers', sportsCenterContrer.apiAllSportsCenters);

router.get('/fetch-sports-center/:id', protect, sportsCenterContrer.apiViewSportsCenters);

router.get('/academy/fetch-youtube-tutorials', academyController.getAllYoutubeVideos);
router.get('/academy/fetch-classes', protect, academyController.getAllAcademies);
router.get('/academy/fetch-classes/:id', protect, academyController.getAcademyById);

router.post('/academy/join-class/:academyId', protect, academyController.joinAcademy);



// Get available slots for a sports center

router.get('/fetch-slots/:id', protect, courtController.getSlots);

router.get('/fetch-slots/:id/court_slots', protect, courtController.getCourtSlots);



router.post(
    '/create-booking/:sports_center_id/:court_id',
    protect,
    bookingsController.apiCreateBooking
);

router.get(
    '/fetch-bookings/public',
    protect,
    bookingsController.getPublicBookings
);


router.post(
    '/join/open-match/:bookingId',
    protect,
    bookingsController.joinPublicBookings
);




// get slots by date as query param e.g sports-centers/1/slots_by_date?date=2025-03-27
router.get('/sports-centers/:id/slots_by_date', courtController.getSlotsForDate);


// Get available courts for a selected slot
// e.g GET /sports-centers/123/courts/10:30 AM
//e.g GET /sports-centers/123/courts/10:30 AM?date=2025-03-27

router.get('/sports-centers/:sportsCenterId/courts/:slot', courtController.getAvailableCourts);

router.post("/book-court/:courtId", param('courtId').isInt().withMessage('Court ID must be an integer'),
    protect, courtController.bookCourt);

router.get('/courts/:sportsCenterId', courtController.getCourtsBySportsCenter);

router.post('/sports-center/add-favourite', protect, UsersController.addToFavouriteSportsCenter);
router.delete('/sports-center/remove-favourite/:sportsCenterId', protect, UsersController.removeFromSavedSportsCenter);


// Cancel a booking (by owner)
router.post('/bookings/:bookingId/cancel', protect, bookingsController.apiCancelBooking);

// Leave a public booking
router.post('/bookings/:bookingId/leave', protect, bookingsController.apiLeavePublicBooking);


// user routes

router.get('/fetch-profile', protect, UsersController.getProfile);

router.put('/update-profile', protect, UsersController.updateProfile);
router.put('/update-dp', protect, UsersController.update_dp);
router.put('/update-fcm-token', protect, UsersController.updateFCMToken);
router.get('/get-fcm-token', protect, UsersController.getFCMToken);


router.post('/notify-user', UsersController.notifyUser);
router.post('/notify-all-users', UsersController.notifyAllUsers);

router.post('/notifications/general', notificationController.createGeneralNotification);
router.post('/notifications/personal', notificationController.sendPersonalNotification);
router.get('/notifications', protect, notificationController.getAllNotifications);
router.put('/notifications/mark-as-read/:notificationId', protect, notificationController.markAsRead);

router.get('/fetch-activities', protect, UsersController.getUserActivities);




// faq endpoint

router.post('/create-faq',

    [
        body('question').notEmpty().withMessage('FAQ Question is required.'),
        body('answer').notEmpty().withMessage('FAQ Asnswer is required.'),

    ],
    faqController.createFaq

);
router.get('/get-all-faqs', faqController.getAllFaqs);
router.get('/get-faq/:id', faqController.getFaqById);
router.put('/update-faq/:id', faqController.updateFaq);
router.delete('/delete-faq/:id', faqController.deleteFaq);


router.get('/fetch-users', UsersController.renderManageUsersJson);


router.get('/user/fetch-transactions', protect, transactionController.getUserTransactions);



// payments

router.get('/paystack/verify', paymentController.verifyPayment);
router.post('/paystack/charge/token', protect, paymentController.chargePayment);
router.get('/user/saved-cards', protect, paymentController.getSavedCards);
router.post('/paystack/initialize', protect, paymentController.initializePayment);




module.exports = router;