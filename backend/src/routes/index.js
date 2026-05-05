const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const packageController = require('../controllers/packageController');
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const commentController = require('../controllers/commentController');
const accessoryController = require('../controllers/accessoryController');
const contractController = require('../controllers/contractController');

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'XM-12223 标准化套餐系统 API 服务正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

router.post('/api/auth/register', userController.register);
router.post('/api/auth/login', userController.login);

router.get('/api/user/profile', auth, userController.getProfile);
router.put('/api/user/profile', auth, userController.updateProfile);
router.put('/api/user/password', auth, userController.changePassword);

router.get('/api/packages', packageController.getPackageList);
router.get('/api/packages/categories', packageController.getPackageCategories);
router.get('/api/packages/:id', packageController.getPackageDetail);
router.post('/api/packages/calculate-price', packageController.calculatePrice);

router.get('/api/accessories/categories', accessoryController.getAccessoryCategories);
router.get('/api/accessories', accessoryController.getAccessoryList);
router.get('/api/accessories/:id', accessoryController.getAccessoryDetail);
router.get('/api/packages/:packageId/accessories', accessoryController.getPackageAccessories);

router.get('/api/upgrades', accessoryController.getUpgradePackages);
router.get('/api/upgrades/:id', accessoryController.getUpgradePackageDetail);

router.get('/api/cart', auth, cartController.getCart);
router.post('/api/cart/package', auth, cartController.addPackageToCart);
router.post('/api/cart/accessory', auth, cartController.addAccessoryToCart);
router.post('/api/cart/upgrade', auth, cartController.addUpgradeToCart);
router.put('/api/cart/items/:itemId', auth, cartController.updateCartItem);
router.delete('/api/cart/items/:itemId', auth, cartController.removeFromCart);
router.delete('/api/cart', auth, cartController.clearCart);
router.get('/api/cart/total', auth, cartController.calculateCartTotal);

router.post('/api/orders', auth, orderController.createOrder);
router.get('/api/orders', auth, orderController.getOrderList);
router.get('/api/orders/stats', auth, orderController.getOrderStatistics);
router.get('/api/orders/:id', auth, orderController.getOrderDetail);
router.post('/api/orders/:id/cancel', auth, orderController.cancelOrder);
router.post('/api/orders/:id/confirm', auth, orderController.confirmOrder);

router.get('/api/packages/:packageId/comments', commentController.getCommentList);
router.post('/api/comments', auth, commentController.createComment);
router.get('/api/comments/my', auth, commentController.getMyComments);
router.post('/api/comments/:commentId/like', auth, commentController.likeComment);
router.post('/api/comments/:commentId/reply', auth, commentController.replyComment);
router.delete('/api/comments/:commentId', auth, commentController.deleteComment);

router.get('/api/contracts/:orderId/preview', auth, contractController.getContractPreview);
router.post('/api/contracts/:orderId/generate', auth, contractController.generateContractPdf);
router.get('/api/contracts/download/:fileName', contractController.downloadContract);

module.exports = router;
