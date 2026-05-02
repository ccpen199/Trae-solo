const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my', authenticate, authorize('bidder'), registrationController.getMyRegistrations);
router.get('/:registrationId/deposit-status', authenticate, registrationController.getDepositStatus);
router.post('/:projectId/register', authenticate, authorize('bidder'), registrationController.registerForProject);
router.post('/:registrationId/lock-deposit', authenticate, registrationController.lockDeposit);
router.post('/:registrationId/activate', authenticate, authorize('tenderer', 'supervisor'), registrationController.activateBiddingRight);
router.get('/project/:projectId', authenticate, authorize('tenderer', 'supervisor', 'auditor'), registrationController.getProjectRegistrations);
router.put('/:registrationId/approve', authenticate, authorize('tenderer', 'supervisor'), registrationController.approveQualification);

module.exports = router;
