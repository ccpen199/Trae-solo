const express = require('express');
const router = express.Router();
const { getProducts, createOrder, getMyOrders } = require('../controllers/mallController');
const { authenticateToken } = require('../middleware/auth');

router.get('/products', getProducts);
router.post('/orders', authenticateToken, createOrder);
router.get('/orders', authenticateToken, getMyOrders);

module.exports = router;
