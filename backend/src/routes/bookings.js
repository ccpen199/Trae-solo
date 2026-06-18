const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

router.get('/slots', auth(), bookingController.getAvailableSlots);
router.get('/', auth(), bookingController.getBookings);
router.get('/:id', auth(), bookingController.getBookingById);
router.post('/', auth(), bookingController.createBooking);
router.post('/:id/confirm', auth(), bookingController.confirmBooking);
router.post('/:id/cancel', auth(), bookingController.cancelBooking);
router.post('/:id/start', auth(), bookingController.startBooking);
router.post('/:id/complete', auth(), bookingController.completeBooking);

module.exports = router;
