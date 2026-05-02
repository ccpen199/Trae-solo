const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const { authMiddleware } = require('../middleware/auth');

router.get('/search', authMiddleware, flightController.searchFlights);
router.get('/airlines', authMiddleware, flightController.getAllAirlines);
router.get('/cabins/:flightId', authMiddleware, flightController.getAvailableCabins);
router.get('/:id', authMiddleware, flightController.getFlightDetail);

module.exports = router;
