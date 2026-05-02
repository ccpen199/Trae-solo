const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', templateController.getTemplates);
router.get('/categories', templateController.getCategories);
router.get('/:id', templateController.getTemplateById);

router.post('/', 
  authorizeRoles(ROLES.DESIGN_OPERATION, ROLES.ADMIN),
  templateController.createTemplate
);

router.put('/:id', 
  authorizeRoles(ROLES.DESIGN_OPERATION, ROLES.ADMIN),
  templateController.updateTemplate
);

router.post('/:id/lock', 
  authorizeRoles(ROLES.DESIGN_OPERATION, ROLES.CREATOR, ROLES.ADMIN),
  templateController.lockTemplate
);

router.post('/:id/unlock', 
  authorizeRoles(ROLES.DESIGN_OPERATION, ROLES.CREATOR, ROLES.ADMIN),
  templateController.unlockTemplate
);

module.exports = router;
