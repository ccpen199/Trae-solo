const express = require('express');
const { Order, SubOrder } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const fulfillmentCenter = require('../services/fulfillmentCenter');

const router = express.Router();

router.post('/dispatch/:orderId', authMiddleware, async (req, res) => {
  try {
    const result = await fulfillmentCenter.fulfillOrder(req.params.orderId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/status/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{ model: SubOrder, as: 'subOrders' }],
    });
    if (!order) return res.status(404).json({ error: '订单不存在' });
    res.json({ orderId: order.id, orderStatus: order.status, subOrders: order.subOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
