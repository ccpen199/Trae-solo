const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

router.get('/statistics', adminController.getStatistics);

router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);

router.get('/products', adminController.getAllProducts);
router.put('/products/:id/status', adminController.updateProductStatus);

router.get('/orders', adminController.getAllOrders);

module.exports = router;
