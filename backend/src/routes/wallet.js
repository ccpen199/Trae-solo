const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const billingGate = require('../engines/BillingGate');

router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const result = await billingGate.getWalletBalance(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('获取钱包余额错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await billingGate.getTransactionHistory(
      req.user.id,
      parseInt(limit),
      parseInt(offset)
    );

    res.json(result);
  } catch (error) {
    console.error('获取交易记录错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
