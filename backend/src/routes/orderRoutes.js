const express = require('express');
const router = express.Router();
const PaymentCenterService = require('../services/paymentCenterService');

router.get('/detail/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const orderDetail = PaymentCenterService.getOrderDetail(parseInt(orderId));
    
    if (!orderDetail) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json({
      success: true,
      data: orderDetail
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/create', (req, res) => {
  try {
    const { userId, businessLineId, originalAmount, levelDiscountAmount, otherDiscountAmount } = req.body;

    if (!userId || !businessLineId || originalAmount === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const order = PaymentCenterService.createOrder(
      parseInt(userId),
      parseInt(businessLineId),
      parseInt(originalAmount),
      parseInt(levelDiscountAmount || 0),
      parseInt(otherDiscountAmount || 0)
    );

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/pay', (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: '缺少orderId参数' });
    }

    const result = PaymentCenterService.completePayment(parseInt(orderId));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('支付订单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/distribute-points', (req, res) => {
  try {
    const { orderId, customPointCoefficient } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: '缺少orderId参数' });
    }

    const result = PaymentCenterService.distributePoints(
      parseInt(orderId),
      customPointCoefficient
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('发放积分失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cancel', (req, res) => {
  try {
    const { orderId, userId, reason } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({ error: '缺少必要参数：orderId, userId' });
    }

    const cancelPrivilege = PaymentCenterService.checkUserHasCancelPrivilege(parseInt(userId));
    if (!cancelPrivilege.hasPrivilege) {
      return res.status(403).json({ 
        error: '您当前等级没有免费取消特权',
        privilege: cancelPrivilege 
      });
    }

    const result = PaymentCenterService.cancelOrder(
      parseInt(orderId),
      parseInt(userId),
      reason || '用户主动取消'
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/cancel-privilege/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const privilege = PaymentCenterService.checkUserHasCancelPrivilege(parseInt(userId));

    res.json({
      success: true,
      data: privilege
    });
  } catch (error) {
    console.error('检查取消特权失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
