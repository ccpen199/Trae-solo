const express = require('express');
const { body } = require('express-validator');
const stockOutController = require('../controllers/stockOutController');
const { authenticateToken } = require('../middlewares/auth');
const { createLogMiddleware } = require('../middlewares/log');

const router = express.Router();

router.use(authenticateToken);

router.get('/', stockOutController.getStockOutList);

router.get('/:id', stockOutController.getStockOutById);

router.post(
  '/',
  [
    body('items').isArray().withMessage('商品列表必须是数组'),
    body('items').custom((value) => {
      if (value.length === 0) {
        throw new Error('请至少添加一条商品');
      }
      return true;
    })
  ],
  createLogMiddleware('create_stock_out', 'stock_out'),
  stockOutController.createStockOut
);

router.put(
  '/:id',
  [
    body('items').isArray().withMessage('商品列表必须是数组'),
    body('items').custom((value) => {
      if (value.length === 0) {
        throw new Error('请至少添加一条商品');
      }
      return true;
    })
  ],
  createLogMiddleware('update_stock_out', 'stock_out'),
  stockOutController.updateStockOut
);

router.post(
  '/:id/complete',
  createLogMiddleware('complete_stock_out', 'stock_out'),
  stockOutController.completeStockOut
);

router.post(
  '/:id/cancel',
  createLogMiddleware('cancel_stock_out', 'stock_out'),
  stockOutController.cancelStockOut
);

module.exports = router;