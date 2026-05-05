const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middlewares/auth');
const { createLogMiddleware } = require('../middlewares/log');

const router = express.Router();

router.use(authenticateToken);

router.get('/', inventoryController.getInventoryList);

router.get('/statistics', inventoryController.getInventoryStatistics);

router.get('/export', 
  createLogMiddleware('export', 'inventory'),
  inventoryController.exportInventory
);

router.get('/detail/:product_id', inventoryController.getInventoryDetail);

module.exports = router;