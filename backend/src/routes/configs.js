const express = require('express');
const { createConfigVersion, getConfigVersions, approveConfigVersion } = require('../controllers/configController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getConfigVersions);
router.post('/', requireRoles('platform_engineer', 'developer', 'app_owner'), createConfigVersion);
router.put('/:id/approve', requireRoles('security_admin', 'platform_engineer'), approveConfigVersion);

module.exports = router;
