import { Router } from 'express';
import * as urbanController from '../controllers/urbanController';

const router = Router();

router.post('/classify', urbanController.classifyTicket);
router.post('/complaint', urbanController.submitComplaint);
router.get('/tickets', urbanController.getTickets);
router.get('/tickets/:id', urbanController.getTicketDetail);
router.post('/tickets/:id/rate', urbanController.rateTicket);
router.get('/vital-signs', urbanController.getVitalSigns);
router.get('/vital-signs/history', urbanController.getVitalSignsHistory);

export default router;
