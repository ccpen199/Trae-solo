const express = require('express');
const productController = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/recommended', productController.getRecommendedProducts);
router.get('/categories', productController.getCategories);
router.get('/categories/all', productController.getAllCategories);
router.get('/:id', productController.getProductById);

router.post('/', authenticate, requireAdmin, productController.createProduct);
router.put('/:id', authenticate, requireAdmin, productController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct);

module.exports = router;