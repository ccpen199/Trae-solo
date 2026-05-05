const express = require('express');
const { body } = require('express-validator');
const stockInController = require('../controllers/stockInController');
const { authenticateToken } = require('../middlewares/auth');
const { createLogMiddleware } = require('../middlewares/log');

const router = express.Router();

router.use(authenticateToken);

router.get('/', stockInController.getStockInList);

router.get('/:id', stockInController.getStockInById);

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
  createLogMiddleware('create_stock_in', 'stock_in'),
  stockInController.createStockIn
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
  createLogMiddleware('update_stock_in', 'stock_in'),
  stockInController.updateStockIn
);

router.post(
  '/:id/complete',
  createLogMiddleware('complete_stock_in', 'stock_in'),
  stockInController.completeStockIn
);

router.post(
  '/:id/cancel',
  createLogMiddleware('cancel_stock_in', 'stock_in'),
  stockInController.cancelStockIn
);

module.exports = router;