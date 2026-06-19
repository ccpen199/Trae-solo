import { Router } from 'express'
import { inventoryController } from '../controllers/InventoryController.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => inventoryController.createInventory(req, res))
router.get('/', authMiddleware, (req, res) => inventoryController.getInventoryList(req, res))
router.get('/stats', authMiddleware, (req, res) => inventoryController.getInventoryStats(req, res))
router.get('/low', authMiddleware, (req, res) => inventoryController.getLowInventory(req, res))
router.get('/:id', authMiddleware, (req, res) => inventoryController.getInventoryDetail(req, res))
router.post('/:id/replenish', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => inventoryController.replenish(req, res))
router.put('/:id/adjust', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => inventoryController.adjustInventory(req, res))
router.get('/:id/logs', authMiddleware, (req, res) => inventoryController.getInventoryLogs(req, res))
router.get('/available/:activityId', authMiddleware, (req, res) => inventoryController.getAvailableQuantity(req, res))

export default router
