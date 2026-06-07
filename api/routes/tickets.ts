import { Router } from 'express';
import { TicketController } from '../controllers/TicketController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
const ticketController = new TicketController();

router.get('/', authMiddleware, ticketController.list.bind(ticketController));
router.get('/stats', authMiddleware, ticketController.stats.bind(ticketController));
router.post('/summarize', authMiddleware, ticketController.summarize.bind(ticketController));
router.post('/', authMiddleware, ticketController.create.bind(ticketController));
router.get('/:id', authMiddleware, ticketController.get.bind(ticketController));
router.put('/:id', authMiddleware, ticketController.update.bind(ticketController));
router.delete('/:id', authMiddleware, requireRole('admin', 'property'), ticketController.delete.bind(ticketController));
router.post('/:id/assign', authMiddleware, requireRole('admin', 'property'), ticketController.assign.bind(ticketController));
router.get('/:id/candidates', authMiddleware, requireRole('admin', 'property'), ticketController.getAssignCandidates.bind(ticketController));
router.post('/:id/start', authMiddleware, requireRole('admin', 'property'), ticketController.start.bind(ticketController));
router.post('/:id/complete', authMiddleware, ticketController.complete.bind(ticketController));
router.post('/:id/cancel', authMiddleware, ticketController.cancel.bind(ticketController));

export default router;
