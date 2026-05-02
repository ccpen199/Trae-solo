const express = require('express');
const router = express.Router();
const transferService = require('../services/transferService');
const monitorService = require('../services/monitorService');

router.post('/execute', async (req, res) => {
  try {
    const { fromUserId, toAccountNumber, amount, description } = req.body;
    
    if (!fromUserId || !toAccountNumber || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: '付款用户ID、收款账户号和金额为必填项' 
      });
    }

    const monitorResult = await monitorService.monitorTransaction(fromUserId, amount);
    
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

    const result = await transferService.executeTransfer(fromUserId, toAccountNumber, amount, description);
    
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

router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const result = await transferService.getTransferHistory(userId, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/voucher/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const result = await transferService.getVoucher(transactionId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/voucher/verify', async (req, res) => {
  try {
    const { voucherNo } = req.body;
    
    if (!voucherNo) {
      return res.status(400).json({ 
        success: false, 
        error: '凭证号为必填项' 
      });
    }

    const result = await transferService.verifyVoucher(voucherNo);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/check-consistency', async (req, res) => {
  try {
    const { accountId } = req.body;
    
    if (!accountId) {
      return res.status(400).json({ 
        success: false, 
        error: '账户ID为必填项' 
      });
    }

    const result = await transferService.checkAccountConsistency(accountId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
