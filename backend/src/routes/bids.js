const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my', authenticate, authorize('bidder'), bidController.getMyBids);
router.get('/:bidId', authenticate, bidController.getBidById);
router.get('/:bidId/verify-signature', authenticate, authorize('auditor', 'supervisor'), bidController.verifyBidSignature);
router.post('/:projectId/place', authenticate, authorize('bidder'), bidController.placeBid);
router.get('/project/:projectId/history', authenticate, bidController.getBidHistory);
router.get('/project/:projectId/ranking', authenticate, bidController.getRealTimeRanking);
router.get('/project/:projectId/statistics', authenticate, bidController.getBidStatistics);
router.get('/project/:projectId/abnormal', authenticate, authorize('supervisor', 'auditor'), bidController.getAbnormalBids);

module.exports = router;
