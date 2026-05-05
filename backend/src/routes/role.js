const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authMiddleware, checkPermission } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', roleController.getRoles);
router.get('/permissions', roleController.getAllPermissions);
router.get('/:id', roleController.getRoleById);
router.post('/', checkPermission('role:add'), roleController.createRole);
router.put('/:id', checkPermission('role:edit'), roleController.updateRole);
router.delete('/:id', checkPermission('role:delete'), roleController.deleteRole);
router.post('/:id/permissions', checkPermission('role:assign'), roleController.assignPermissions);

module.exports = router;
