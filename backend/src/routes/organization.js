const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { authMiddleware, checkPermission } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', organizationController.getOrganizations);
router.get('/:id', organizationController.getOrganizationById);
router.post('/', checkPermission('organization:add'), organizationController.createOrganization);
router.put('/:id', checkPermission('organization:edit'), organizationController.updateOrganization);
router.delete('/:id', checkPermission('organization:delete'), organizationController.deleteOrganization);

module.exports = router;
