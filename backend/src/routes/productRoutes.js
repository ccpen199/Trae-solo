const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);
router.get('/', productController.getProducts);

router.post('/', authMiddleware, adminMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, adminMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, productController.deleteProduct);

router.get('/admin/all', authMiddleware, adminMiddleware, productController.getAllProductsAdmin);
router.post('/categories', authMiddleware, adminMiddleware, productController.createCategory);
router.put('/categories/:id', authMiddleware, adminMiddleware, productController.updateCategory);
router.delete('/categories/:id', authMiddleware, adminMiddleware, productController.deleteCategory);

module.exports = router;
