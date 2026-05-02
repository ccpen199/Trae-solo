const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const statusFlowService = require('../services/statusFlowService');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/scan', requireRole('rider'), (req, res) => {
  try {
    const { vehicle_id, lock_id, location } = req.body;

    if (!vehicle_id || !lock_id) {
      return res.status(400).json({ error: '车辆ID和锁ID不能为空' });
    }

    const result = orderService.createOrder(req.user.id, vehicle_id, lock_id, location);
    res.json(result);
  } catch (error) {
    console.error('Scan unlock error:', error);
    res.status(500).json({ error: error.message || '扫码开锁失败' });
  }
});

router.post('/:id/start', requireRole('rider'), (req, res) => {
  try {
    const { id } = req.params;
    const { location } = req.body;

    const result = orderService.startRide(id, req.user.id, location);
    res.json(result);
  } catch (error) {
    console.error('Start ride error:', error);
    res.status(500).json({ error: error.message || '开始骑行失败' });
  }
});

router.post('/:id/end', requireRole('rider'), (req, res) => {
  try {
    const { id } = req.params;
    const { location } = req.body;

    const result = orderService.endRide(id, req.user.id, location);
    res.json(result);
  } catch (error) {
    console.error('End ride error:', error);
    res.status(500).json({ error: error.message || '结束骑行失败' });
  }
});

router.post('/:id/confirm-billing', requireRole('rider'), (req, res) => {
  try {
    const { id } = req.params;

    const result = orderService.confirmBilling(id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Confirm billing error:', error);
    res.status(500).json({ error: error.message || '确认计费失败' });
  }
});

router.post('/:id/pay', requireRole('rider'), (req, res) => {
  try {
    const { id } = req.params;

    const result = orderService.payOrder(id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Pay order error:', error);
    res.status(500).json({ error: error.message || '支付失败' });
  }
});

router.get('/', (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const orders = orderService.getOrders(req.user.id, req.user.role, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = orderService.getDashboardStats(req.user.role);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const order = orderService.getOrderById(id, req.user.id, req.user.role);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const statusFlows = statusFlowService.getStatusFlows('order', id);
    res.json({ order, statusFlows });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: error.message || '获取订单详情失败' });
  }
});

module.exports = router;
