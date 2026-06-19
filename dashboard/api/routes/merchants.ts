import { Router } from 'express'
import { merchantController } from '../controllers/MerchantController.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => merchantController.createMerchant(req, res))
router.get('/', authMiddleware, (req, res) => merchantController.getMerchantList(req, res))
router.get('/stats', authMiddleware, (req, res) => merchantController.getMerchantStats(req, res))
router.get('/:id', authMiddleware, (req, res) => merchantController.getMerchantDetail(req, res))
router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => merchantController.updateMerchant(req, res))
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), (req, res) => merchantController.updateMerchantStatus(req, res))
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => merchantController.deleteMerchant(req, res))

router.post('/:merchantId/stores', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => merchantController.createStore(req, res))
router.get('/:merchantId/stores', authMiddleware, (req, res) => merchantController.getStoresByMerchant(req, res))
router.get('/stores/:id', authMiddleware, (req, res) => merchantController.getStoreDetail(req, res))
router.put('/stores/:id', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => merchantController.updateStore(req, res))
router.delete('/stores/:id', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => merchantController.deleteStore(req, res))

router.post('/stores/:storeId/terminals', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => merchantController.createTerminal(req, res))
router.get('/stores/:storeId/terminals', authMiddleware, (req, res) => merchantController.getTerminalsByStore(req, res))
router.get('/:merchantId/terminals', authMiddleware, (req, res) => merchantController.getTerminalsByMerchant(req, res))
router.get('/terminals/:id', authMiddleware, (req, res) => merchantController.getTerminalDetail(req, res))
router.put('/terminals/:id', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => merchantController.updateTerminal(req, res))
router.delete('/terminals/:id', authMiddleware, roleMiddleware('admin', 'merchant'), (req, res) => merchantController.deleteTerminal(req, res))
router.post('/terminals/heartbeat', authMiddleware, (req, res) => merchantController.updateTerminalHeartbeat(req, res))

export default router
