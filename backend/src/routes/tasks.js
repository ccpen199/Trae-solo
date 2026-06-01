const express = require('express');
const { createTask, getTasks, getTaskById, approveTask, executeTask } = require('../controllers/taskController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', requireRoles('platform_engineer', 'ops', 'app_owner', 'developer'), createTask);
router.put('/:id/approve', requireRoles('platform_engineer', 'security_admin'), approveTask);
router.post('/:id/execute', requireRoles('platform_engineer', 'ops'), executeTask);

module.exports = router;
