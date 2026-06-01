import { Router } from 'express';
import * as ticketController from '../controllers/ticketController.js';

const router = Router();

router.get('/user/:userId', ticketController.getUserTickets);
router.get('/:contractId', ticketController.getTicketDetail);
router.get('/:contractId/qrcode', ticketController.generateQRCode);
router.post('/verify', ticketController.verifyTicket);
router.post('/watermark', ticketController.generateWatermark);

export default router;
