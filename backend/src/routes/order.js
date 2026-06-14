const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, orderController.getList);
router.get('/:id', auth, orderController.getDetail);
router.post('/', auth, orderController.create);
router.put('/:id/status', auth, orderController.updateStatus);
router.post('/:id/weigh', auth, orderController.uploadWeigh);
router.post('/:id/sign-contract', auth, orderController.signContract);
router.post('/:id/confirm', auth, orderController.confirm);

module.exports = router;
