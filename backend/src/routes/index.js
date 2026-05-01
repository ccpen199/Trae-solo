const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const contentRoutes = require('./contentRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const interactionRoutes = require('./interactionRoutes');
const negativeFeedbackRoutes = require('./negativeFeedbackRoutes');
const adRoutes = require('./adRoutes');
const analyticsRoutes = require('./analyticsRoutes');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'News App API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test successful',
    headers: req.headers,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/contents', contentRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/interactions', interactionRoutes);
router.use('/negative-feedbacks', negativeFeedbackRoutes);
router.use('/ads', adRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
