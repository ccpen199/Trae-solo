const express = require('express');
const { createEnvironment, getEnvironments } = require('../controllers/environmentController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getEnvironments);
router.post('/', requireRoles('platform_engineer', 'ops', 'app_owner'), createEnvironment);

module.exports = router;
