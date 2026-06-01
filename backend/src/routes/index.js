const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const homeController = require('../controllers/homeController');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');

router.post('/user/login', userController.login);
router.get('/home', homeController.getHomeData);
router.get('/home/banners', homeController.getBanners);
router.get('/home/themes', homeController.getThemes);
router.get('/home/new', homeController.getNewProducts);
router.get('/home/recommend', homeController.getRecommendProducts);

router.get('/categories', productController.getCategories);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductDetail);
router.get('/themes/:id', productController.getThemeProducts);

router.use(authMiddleware);

router.get('/user/info', userController.getUserInfo);
router.put('/user/info', userController.updateUserInfo);
router.get('/user/coupons', userController.getCoupons);

router.get('/cart', cartController.getCart);
router.post('/cart', cartController.addToCart);
router.put('/cart', cartController.updateCart);
router.delete('/cart', cartController.deleteCart);
router.post('/cart/select-all', cartController.toggleSelectAll);

router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrderDetail);
router.post('/orders', orderController.createOrder);
router.post('/orders/cancel', orderController.cancelOrder);
router.post('/orders/pay', orderController.payOrder);
router.post('/orders/confirm', orderController.confirmOrder);
router.get('/orders/:id/pickup', orderController.getPickupCode);

module.exports = router;
