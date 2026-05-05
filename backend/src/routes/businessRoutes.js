const express = require('express');
const router = express.Router();
const BusinessLineService = require('../services/businessLineService');
const PaymentCenterService = require('../services/paymentCenterService');

router.get('/lines', (req, res) => {
  try {
    const businessLines = BusinessLineService.getAllBusinessLines();
    
    res.json({
      success: true,
      data: businessLines
    });
  } catch (error) {
    console.error('获取业务线列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/line/:id', (req, res) => {
  try {
    const { id } = req.params;
    const businessLine = BusinessLineService.getBusinessLineById(parseInt(id));
    
    if (!businessLine) {
      return res.status(404).json({ error: '业务线不存在' });
    }

    res.json({
      success: true,
      data: businessLine
    });
  } catch (error) {
    console.error('获取业务线信息失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/products/:businessLineId', (req, res) => {
  try {
    const { businessLineId } = req.params;
    const result = BusinessLineService.getBusinessLineProducts(parseInt(businessLineId));
    
    if (!result) {
      return res.status(404).json({ error: '业务线不存在' });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取业务线产品失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/purchase', (req, res) => {
  try {
    const { userId, businessLineId, productCode, originalAmount, customPointCoefficient } = req.body;

    if (!userId || !businessLineId || !originalAmount) {
      return res.status(400).json({ error: '缺少必要参数：userId, businessLineId, originalAmount' });
    }

    const result = BusinessLineService.simulateBusinessPurchase(
      parseInt(userId),
      parseInt(businessLineId),
      productCode,
      parseInt(originalAmount),
      customPointCoefficient
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('模拟消费失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/accounts', (req, res) => {
  try {
    const accounts = PaymentCenterService.getAllBusinessAccounts();
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('获取积分账户列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/account/:businessLineId', (req, res) => {
  try {
    const { businessLineId } = req.params;
    const account = PaymentCenterService.getBusinessAccount(parseInt(businessLineId));
    
    if (!account) {
      return res.status(404).json({ error: '业务线积分账户不存在' });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('获取积分账户失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
