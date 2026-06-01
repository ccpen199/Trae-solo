const express = require('express');
const { 
  createChangeOrder, getChangeOrders, getChangeOrderById, reviewChangeOrder,
  getAlerts, updateAlertStatus, getExceptions, handleException, getDashboardStats
} = require('../controllers/operationController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardStats);

router.get('/change-orders', getChangeOrders);
router.get('/change-orders/:id', getChangeOrderById);
router.post('/change-orders', requireRoles('platform_engineer', 'app_owner', 'developer'), createChangeOrder);
router.put('/change-orders/:id/review', requireRoles('security_admin', 'platform_engineer'), reviewChangeOrder);

router.get('/alerts', getAlerts);
router.put('/alerts/:id/status', updateAlertStatus);

router.get('/exceptions', getExceptions);
router.put('/exceptions/:id/handle', requireRoles('platform_engineer', 'ops', 'security_admin'), handleException);

module.exports = router;
