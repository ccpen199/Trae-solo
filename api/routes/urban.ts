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

router.get('/dispatch-rules', urbanController.getDispatchRules);
router.post('/dispatch-rules', urbanController.createDispatchRule);
router.put('/dispatch-rules/:id', urbanController.updateDispatchRule);
router.post('/dispatch-rules/:id/toggle', urbanController.toggleDispatchRule);
router.delete('/dispatch-rules/:id', urbanController.deleteDispatchRule);

router.get('/department-stats', urbanController.getDepartmentStats);
router.get('/department-receipts', urbanController.getDepartmentReceipts);

router.get('/dashboard/transportation', urbanController.getTransportationDashboard);
router.get('/dashboard/medical', urbanController.getMedicalDashboard);
router.get('/dashboard/utilities', urbanController.getUtilitiesDashboard);
router.get('/dashboard/government', urbanController.getGovernmentDashboard);

export default router;
