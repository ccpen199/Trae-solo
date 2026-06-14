const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('admin'));

router.get('/stats', adminController.getStats);
router.get('/waste-review', adminController.getWasteReviewList);
router.post('/waste-review/:id', adminController.reviewWaste);
router.get('/user-audit', adminController.getUserAuditList);
router.post('/user-audit/:id', adminController.auditUser);
router.get('/env-report', adminController.getEnvReport);
router.post('/env-report/submit', adminController.submitEnvReport);

module.exports = router;
