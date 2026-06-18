const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.get('/community-overview', auth('operator', 'property'), analyticsController.getCommunityOverview);
router.get('/funnel', auth('operator', 'property'), analyticsController.getFunnelAnalysis);
router.get('/usage', auth('operator', 'property'), analyticsController.getUsageStatistics);
router.get('/devices', auth('operator', 'property'), analyticsController.getDeviceStatistics);
router.get('/grid-operations', auth('operator', 'property'), analyticsController.getGridOperations);
router.get('/eco-incentive', auth('operator'), analyticsController.getEcoIncentiveStats);

module.exports = router;
