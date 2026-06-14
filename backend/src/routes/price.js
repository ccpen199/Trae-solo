const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const { auth } = require('../middleware/auth');

router.get('/market', priceController.getMarket);
router.post('/estimate', priceController.estimate);
router.get('/trends', priceController.getTrends);

module.exports = router;
