const express = require('express');
const router = express.Router();
const houseController = require('../controllers/houseController');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { createHouseValidator, houseSearchValidator, idParamValidator } = require('../middleware/validators');

router.get('/', houseSearchValidator, optionalAuth, houseController.getHouseList);

router.get('/my', authenticate, houseController.getMyHouses);

router.get('/:id', idParamValidator, optionalAuth, houseController.getHouseDetail);

router.post('/', authenticate, requireRole('landlord'), createHouseValidator, houseController.createHouse);

router.put('/:id', authenticate, requireRole('landlord'), idParamValidator, houseController.updateHouse);

router.post('/:id/favorite', authenticate, idParamValidator, houseController.toggleFavorite);

module.exports = router;
