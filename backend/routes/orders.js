import express from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import Order from '../models/Order.js';
import Shop from '../models/Shop.js';
import Log from '../models/Log.js';
import { OrderSyncEngine } from '../engines/OrderSyncEngine.js';
import { ProfitEngine } from '../engines/ProfitEngine.js';

const router = express.Router();
const orderSyncEngine = new OrderSyncEngine();
const profitEngine = new ProfitEngine();

router.get('/', async (req, res) => {
  try {
    const { shop_id, platform, status, start_date, end_date, page = 1, limit = 20 } = req.query;
    const where = {};

    if (shop_id) where.shop_id = shop_id;
    if (platform) where.platform = platform;
    if (status) where.status = status;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{ model: Shop, as: 'shop' }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Shop, as: 'shop' }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/processing-chain', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      attributes: ['id', 'platform_order_id', 'processing_chain']
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ processing_chain: order.processing_chain || [] });
  } catch (error) {
    console.error('Get processing chain error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    const order = await orderSyncEngine.updateOrderStatus(req.params.id, status, req.user.id);

    res.json({ order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/:id/confirm', async (req, res) => {
  try {
    const order = await orderSyncEngine.autoReview(req.params.id);

    res.json({
      message: 'Order confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel order in current status' });
    }

    order.status = 'cancelled';
    await order.save();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'cancel_order',
      target: 'order',
      target_id: order.id,
      message: `Order ${order.platform_order_id} cancelled`,
      details: { reason: req.body.reason }
    });

    res.json({ order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/merge', [
  body('order_ids').isArray({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { order_ids } = req.body;

    const mergedOrder = await orderSyncEngine.mergeOrders(order_ids, req.user.id);

    res.json({
      message: 'Orders merged successfully',
      order: mergedOrder
    });
  } catch (error) {
    console.error('Merge orders error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const { shop_id } = req.body;

    if (shop_id) {
      const result = await orderSyncEngine.syncOrders(shop_id);
      res.json(result);
    } else {
      await orderSyncEngine.syncAllShops();
      res.json({ message: 'All shops synced' });
    }
  } catch (error) {
    console.error('Sync orders error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

router.get('/:id/profit', async (req, res) => {
  try {
    const profitData = await profitEngine.calculateOrderProfit(req.params.id);

    res.json(profitData);
  } catch (error) {
    console.error('Calculate order profit error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;