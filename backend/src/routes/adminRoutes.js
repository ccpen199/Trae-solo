const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRole('admin'));

router.get('/dashboard', adminController.getDashboardStats);

router.get('/verifications/pending', adminController.getPendingVerifications);
router.put('/verifications/:propertyId/stage/:stage', adminController.verifyPropertyStage);

router.get('/disputes', adminController.getDisputes);
router.put('/disputes/:disputeId/resolve', adminController.resolveDispute);

router.get('/rent-index', adminController.getRentIndex);

router.get('/quality-inspections', adminController.getQualityInspections);
router.post('/quality-inspections', adminController.createQualityInspection);
router.put('/quality-inspections/:inspectionId', adminController.updateQualityInspection);

module.exports = router;
