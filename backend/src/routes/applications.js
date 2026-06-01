const express = require('express');
const { createApplication, getApplications, getApplicationById, approveApplication } = require('../controllers/applicationController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getApplications);
router.get('/:id', getApplicationById);
router.post('/', requireRoles('platform_engineer', 'app_owner', 'developer'), createApplication);
router.put('/:id/approve', requireRoles('platform_engineer', 'security_admin'), approveApplication);

module.exports = router;
