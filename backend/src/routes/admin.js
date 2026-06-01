const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/stats', authenticate, requireAdmin, adminController.getDashboardStats);
router.get('/merchants/applications', authenticate, requireAdmin, adminController.getMerchantApplications);
router.post('/merchants/approve', authenticate, requireAdmin, adminController.approveMerchant);
router.get('/reports', authenticate, requireAdmin, adminController.getReports);
router.post('/reports/handle', authenticate, requireAdmin, adminController.handleReport);
router.get('/tickets', authenticate, requireAdmin, adminController.getTickets);
router.get('/tickets/:id', authenticate, requireAdmin, adminController.getTicketDetail);
router.post('/tickets/reply', authenticate, requireAdmin, adminController.replyTicket);
router.post('/tickets/close', authenticate, requireAdmin, adminController.closeTicket);
router.get('/flagged-listings', authenticate, requireAdmin, adminController.getFlaggedListings);

module.exports = router;
