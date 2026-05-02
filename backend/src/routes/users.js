const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const ledgerKernel = require('../engines/ledgerKernel');

router.post('/register', async (req, res) => {
  try {
    const { username, password, phone, email } = req.body;
    
    if (!username || !password || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: '用户名、密码和手机号为必填项' 
      });
    }

    const result = await userService.register(username, password, phone, email);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '用户名和密码为必填项' 
      });
    }

    const result = await userService.login(username, password);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

router.post('/activate', async (req, res) => {
  try {
    const { userId, realName, idCard, bankCardNumber, bankName } = req.body;
    
    if (!userId || !realName || !idCard || !bankCardNumber) {
      return res.status(400).json({ 
        success: false, 
        error: '用户ID、真实姓名、身份证号和银行卡号为必填项' 
      });
    }

    const result = await userService.activateRealName(userId, realName, idCard, bankCardNumber, bankName || '默认银行');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/info/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await userService.getUserInfo(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const result = await userService.getAccountTransactions(userId, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/recharge', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: '用户ID和金额为必填项' 
      });
    }

    const result = await userService.recharge(userId, amount);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
