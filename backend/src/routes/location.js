const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location');
const authMiddleware = require('../middleware/auth');

router.get('/cities', locationController.getCities);
router.get('/cities/default', locationController.getDefaultCity);
router.get('/cities/:id', locationController.getCityById);
router.get('/current', locationController.getCurrentLocation);
router.post('/save', authMiddleware, locationController.saveLocation);

module.exports = router;