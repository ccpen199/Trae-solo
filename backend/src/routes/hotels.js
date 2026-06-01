const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

router.get('/', hotelController.getAllHotels);
router.post('/', hotelController.createHotel);
router.put('/:id', hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);

router.get('/:hotelId/room-types', hotelController.getRoomTypes);
router.post('/room-types', hotelController.createRoomType);

module.exports = router;
