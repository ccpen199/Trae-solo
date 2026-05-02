const express = require('express');
const authRoutes = require('./auth');
const billsRoutes = require('./bills');
const endorsementsRoutes = require('./endorsements');
const discountsRoutes = require('./discounts');
const maturitiesRoutes = require('./maturities');
const differencesRoutes = require('./differences');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/bills', billsRoutes);
router.use('/endorsements', endorsementsRoutes);
router.use('/discounts', discountsRoutes);
router.use('/maturities', maturitiesRoutes);
router.use('/differences', differencesRoutes);

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'API 服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
