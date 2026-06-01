const express = require('express');
const { getCallLogs, getCallLogById, getAuditLogs } = require('../controllers/logController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/calls', getCallLogs);
router.get('/calls/:id', getCallLogById);
router.get('/audit', requireRoles('security_admin', 'platform_engineer'), getAuditLogs);

module.exports = router;
