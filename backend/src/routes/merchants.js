const express = require('express');
const { authenticate, requireMerchant } = require('../middleware/auth');
const merchantController = require('../controllers/merchantController');

const router = express.Router();

router.post('/apply', authenticate, merchantController.applyMerchant);
router.get('/profile', authenticate, requireMerchant, merchantController.getMerchantProfile);
router.get('/listings', authenticate, requireMerchant, merchantController.getMerchantListings);
router.get('/leads', authenticate, requireMerchant, merchantController.getLeads);
router.put('/leads/status', authenticate, requireMerchant, merchantController.updateLeadStatus);
router.post('/leads', authenticate, merchantController.createLead);

module.exports = router;
