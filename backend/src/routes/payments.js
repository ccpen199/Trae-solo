const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const monitorService = require('../services/monitorService');

router.post('/scan', async (req, res) => {
  try {
    const { userId, merchantNo, amount, description } = req.body;
    
    if (!userId || !merchantNo || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: '用户ID、商户号和金额为必填项' 
      });
    }

    const monitorResult = await monitorService.monitorTransaction(userId, amount);
    
    if (monitorResult.limitCheck.exceeded) {
      return res.status(403).json({
        success: false,
        error: '日限额超限',
        details: monitorResult
      });
    }

    if (monitorResult.actions.some(a => a.type === 'account_frozen')) {
      return res.status(403).json({
        success: false,
        error: '账户已被冻结，请联系客服',
        details: monitorResult
      });
    }

    const result = await paymentService.scanAndPay(userId, merchantNo, amount, description);
    
    res.json({ 
      success: true, 
      data: {
        ...result,
        monitorResult
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/qrcode', async (req, res) => {
  try {
    const { merchantId, amount } = req.body;
    
    if (!merchantId) {
      return res.status(400).json({ 
        success: false, 
        error: '商户ID为必填项' 
      });
    }

    const result = await paymentService.generateQRCode(merchantId, amount);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const result = await paymentService.getPaymentStatus(transactionId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/merchant/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const result = await paymentService.getMerchantPayments(merchantId, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
