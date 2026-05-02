const express = require('express');
const router = express.Router();
const reverseController = require('../controllers/reverseController');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/types', reverseController.getReverseTypes);
router.get('/transitions', reverseController.getValidTransitions);
router.get('/', reverseController.getReverseOrders);
router.get('/validate/:orderId', reverseController.validateWithMainLedger);

router.post('/', 
  authorizeRoles(ROLES.DESIGN_OPERATION, ROLES.MERCHANT, ROLES.CREATOR, ROLES.ADMIN),
  reverseController.createReverseOrder
);

router.put('/:id/status', 
  authorizeRoles(ROLES.DESIGN_OPERATION, ROLES.AUDITOR, ROLES.ADMIN),
  reverseController.updateReverseStatus
);

module.exports = router;
