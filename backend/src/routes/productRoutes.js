const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middlewares/auth');
const { createLogMiddleware } = require('../middlewares/log');

const router = express.Router();

router.use(authenticateToken);

router.get('/types', productController.getProductTypes);

router.get('/types/all', productController.getAllProductTypes);

router.post(
  '/types',
  [
    body('type_name').notEmpty().withMessage('商品类型名称不能为空')
  ],
  createLogMiddleware('create_product_type', 'product'),
  productController.createProductType
);

router.delete(
  '/types/:id',
  createLogMiddleware('delete_product_type', 'product'),
  productController.deleteProductType
);

router.get('/', productController.getProducts);

router.get('/:id', productController.getProductById);

router.post(
  '/',
  [
    body('product_code').notEmpty().withMessage('商品编码不能为空'),
    body('product_name').notEmpty().withMessage('商品名称不能为空'),
    body('type_id').notEmpty().withMessage('商品类型不能为空').isInt().withMessage('商品类型ID必须是整数')
  ],
  createLogMiddleware('create_product', 'product'),
  productController.createProduct
);

router.put(
  '/:id',
  [
    body('product_name').notEmpty().withMessage('商品名称不能为空'),
    body('type_id').notEmpty().withMessage('商品类型不能为空').isInt().withMessage('商品类型ID必须是整数')
  ],
  createLogMiddleware('update_product', 'product'),
  productController.updateProduct
);

router.delete(
  '/:id',
  createLogMiddleware('delete_product', 'product'),
  productController.deleteProduct
);

module.exports = router;