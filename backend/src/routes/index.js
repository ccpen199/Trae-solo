const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/devices', require('./devices'));
router.use('/bookings', require('./bookings'));
router.use('/orders', require('./orders'));
router.use('/work-orders', require('./workOrders'));
router.use('/packages', require('./packages'));
router.use('/analytics', require('./analytics'));
router.use('/eco', require('./eco'));

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Community IoT Platform API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
