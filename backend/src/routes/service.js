const express = require('express');
const router = express.Router();
const { getServices, createServiceOrder, getMyServiceOrders, createConsultation, getMyConsultations } = require('../controllers/serviceController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', getServices);
router.post('/orders', authenticateToken, createServiceOrder);
router.get('/orders', authenticateToken, getMyServiceOrders);
router.post('/consultations', authenticateToken, createConsultation);
router.get('/consultations', authenticateToken, getMyConsultations);

module.exports = router;
