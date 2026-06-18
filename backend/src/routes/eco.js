const express = require('express');
const router = express.Router();
const ecoIncentiveController = require('../controllers/ecoIncentiveController');
const auth = require('../middleware/auth');

router.get('/status', auth(), ecoIncentiveController.getMyEcoStatus);
router.get('/vouchers/available', auth(), ecoIncentiveController.getAvailableVouchers);
router.get('/vouchers', auth(), ecoIncentiveController.getMyVouchers);
router.post('/vouchers/claim', auth(), ecoIncentiveController.claimVoucher);
router.get('/leaderboard', auth(), ecoIncentiveController.getEcoLeaderboard);

module.exports = router;
