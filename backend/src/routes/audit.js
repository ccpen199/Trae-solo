const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, auditController.getDashboardStats);
router.get('/logs', authenticate, authorize('auditor', 'supervisor'), auditController.getAuditLogs);
router.get('/logs/:logId', authenticate, authorize('auditor', 'supervisor'), auditController.getAuditLogById);
router.get('/verify-chain', authenticate, authorize('auditor', 'supervisor'), auditController.verifyChainIntegrity);
router.get('/bid-trace/:projectId', authenticate, authorize('auditor', 'supervisor'), auditController.getBidTraceGraph);
router.get('/risk-report', authenticate, authorize('auditor', 'supervisor'), auditController.getRiskAuditReport);
router.get('/operation-history/:resourceType/:resourceId', authenticate, auditController.getOperationHistory);
router.get('/high-risk-logs', authenticate, authorize('auditor', 'supervisor'), auditController.getHighRiskLogs);
router.post('/verify-all-signatures', authenticate, authorize('auditor', 'supervisor'), auditController.verifyAllSignatures);

module.exports = router;
