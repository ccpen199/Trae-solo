import express from 'express';
import orderService from '../services/order-service.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  try {
    const { order_type, status } = req.query;
    const filters = {};
    if (order_type) filters.order_type = order_type;
    if (status) filters.status = status;
    
    const orders = orderService.getUserOrders(req.user.userId, filters);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const order = orderService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.user_id !== req.user.userId) {
      return res.status(403).json({ error: '无权访问此订单' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/purchase', authenticateToken, (req, res) => {
  try {
    const { productId, amount } = req.body;
    if (!productId || !amount || amount <= 0) {
      return res.status(400).json({ error: '参数无效' });
    }
    const order = orderService.createPurchase(req.user.userId, productId, amount);
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/confirm-payment', authenticateToken, (req, res) => {
  try {
    const order = orderService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.user_id !== req.user.userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }
    const result = orderService.confirmPayment(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/complete', authenticateToken, (req, res) => {
  try {
    const order = orderService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.user_id !== req.user.userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }
    
    let result;
    if (order.order_type === 'purchase') {
      result = orderService.completePurchase(req.params.id);
    } else {
      result = orderService.completeRedemption(req.params.id);
    }
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/redemption', authenticateToken, (req, res) => {
  try {
    const { productId, shares } = req.body;
    if (!productId || !shares || shares <= 0) {
      return res.status(400).json({ error: '参数无效' });
    }
    const order = orderService.createRedemption(req.user.userId, productId, shares);
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/confirm-redemption', authenticateToken, (req, res) => {
  try {
    const order = orderService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.user_id !== req.user.userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }
    const result = orderService.confirmRedemption(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/reject', authenticateToken, (req, res) => {
  try {
    const { reason } = req.body;
    const order = orderService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    const result = orderService.rejectOrder(req.params.id, reason || '用户取消');
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/retry', authenticateToken, (req, res) => {
  try {
    const order = orderService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    const result = orderService.retryOrder(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/close', authenticateToken, (req, res) => {
  try {
    const order = orderService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    const result = orderService.closeOrder(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
