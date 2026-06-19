import { Router } from 'express'
import { alertController } from '../controllers/AlertController.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req, res) => alertController.getAlerts(req, res))
router.get('/stats', authMiddleware, (req, res) => alertController.getAlertStats(req, res))
router.get('/unread/count', authMiddleware, (req, res) => alertController.getUnreadCount(req, res))
router.post('/check', authMiddleware, roleMiddleware('admin'), (req, res) => alertController.runAlertChecks(req, res))
router.post('/check/inventory', authMiddleware, roleMiddleware('admin'), (req, res) => alertController.checkInventoryAlerts(req, res))
router.get('/:id', authMiddleware, (req, res) => alertController.getAlertDetail(req, res))
router.patch('/:id/read', authMiddleware, (req, res) => alertController.markAsRead(req, res))
router.post('/read-all', authMiddleware, (req, res) => alertController.markAllAsRead(req, res))
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => alertController.deleteAlert(req, res))
router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => alertController.createAlert(req, res))
router.post('/clear-old', authMiddleware, roleMiddleware('admin'), (req, res) => alertController.clearOldAlerts(req, res))

export default router
