const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/low-stock', authorize('inventory:read'), inventoryController.getLowStockAlert);
router.get('/logs', authorize('inventory:read'), inventoryController.getInventoryLogs);

router.get('/', authorize('inventory:read'), inventoryController.getInventories);
router.get('/:id', authorize('inventory:read'), inventoryController.getInventoryById);
router.post('/', authorize('inventory:write'), inventoryController.createInventory);
router.put('/:id', authorize('inventory:write'), inventoryController.updateInventory);
router.post('/:id/adjust', authorize('inventory:write'), inventoryController.adjustInventory);
router.delete('/:id', authorize('inventory:delete'), inventoryController.deleteInventory);

module.exports = router;
