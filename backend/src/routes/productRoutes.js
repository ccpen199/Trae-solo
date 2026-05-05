const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', productController.getProducts);
router.get('/my', authenticateToken, productController.getMyProducts);
router.get('/:id', optionalAuth, productController.getProductById);

router.post('/', authenticateToken, upload.array('images', 9), productController.createProduct);
router.put('/:id', authenticateToken, upload.array('images', 9), productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

module.exports = router;
