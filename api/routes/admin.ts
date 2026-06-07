import { Router } from 'express';
import { 
  getDashboardStats,
  getSalesTrend,
  getTickets,
  processTicket,
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
  getOrders,
  getUsers
} from '../controllers/adminController.js';
import authMiddleware, { adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', getDashboardStats);
router.get('/dashboard', getDashboardStats);
router.get('/dashboard/stats', getDashboardStats);
router.get('/sales-trend', getSalesTrend);

router.get('/tickets', getTickets);
router.post('/tickets/:id/process', processTicket);
router.post('/tickets/:id/resolve', (req, res) => {
  req.body.status = 'resolved';
  processTicket(req, res);
});
router.post('/tickets/:id/reject', (req, res) => {
  req.body.status = 'rejected';
  processTicket(req, res);
});

router.get('/properties', getProperties);
router.post('/properties', createProperty);
router.put('/properties/:id', updateProperty);
router.delete('/properties/:id', deleteProperty);

router.get('/commission-rules', getCommissionRules);
router.post('/commission-rules', createCommissionRule);
router.put('/commission-rules/:id', updateCommissionRule);
router.delete('/commission-rules/:id', deleteCommissionRule);
router.get('/commission/rules', getCommissionRules);
router.post('/commission/rules', createCommissionRule);
router.put('/commission/rules/:id', updateCommissionRule);
router.delete('/commission/rules/:id', deleteCommissionRule);

router.get('/orders', getOrders);
router.get('/users', getUsers);

export default router;
