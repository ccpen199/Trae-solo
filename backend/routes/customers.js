import express from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import AfterSale from '../models/AfterSale.js';
import Order from '../models/Order.js';
import Log from '../models/Log.js';
import Alert from '../models/Alert.js';

const router = express.Router();

router.get('/after-sales', async (req, res) => {
  try {
    const { type, status, start_date, end_date, page = 1, limit = 20 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: afterSales } = await AfterSale.findAndCountAll({
      where,
      include: [{
        model: Order,
        as: 'order',
        attributes: ['id', 'platform_order_id', 'total_amount', 'status']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      afterSales,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get after-sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/after-sales/:id', async (req, res) => {
  try {
    const afterSale = await AfterSale.findByPk(req.params.id, {
      include: [{
        model: Order,
        as: 'order'
      }]
    });

    if (!afterSale) {
      return res.status(404).json({ error: 'After-sale record not found' });
    }

    res.json({ afterSale });
  } catch (error) {
    console.error('Get after-sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/after-sales/:id/processing-chain', async (req, res) => {
  try {
    const afterSale = await AfterSale.findByPk(req.params.id, {
      attributes: ['id', 'platform_after_sale_id', 'processing_chain']
    });

    if (!afterSale) {
      return res.status(404).json({ error: 'After-sale record not found' });
    }

    res.json({ processing_chain: afterSale.processing_chain || [] });
  } catch (error) {
    console.error('Get processing chain error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/after-sales', [
  body('order_id').isInt(),
  body('type').isIn(['refund', 'return', 'dispute']),
  body('reason').optional().isString(),
  body('description').optional().isString(),
  body('amount').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findByPk(req.body.order_id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { type, reason, description, amount, images } = req.body;

    const afterSale = await AfterSale.create({
      order_id: order.id,
      type,
      reason,
      description,
      status: 'pending',
      amount: amount || 0,
      images: images || [],
      processing_chain: [{
        action: 'create',
        message: 'After-sale record created',
        timestamp: new Date().toISOString(),
        operator: req.user.name || req.user.username
      }]
    });

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'create_after_sale',
      target: 'after_sale',
      target_id: afterSale.id,
      message: `Created ${type} after-sale for order ${order.platform_order_id}`,
      details: { order_id: order.id, type, reason }
    });

    if (req.io) {
      req.io.to('user:operation').emit('after_sale:created', {
        afterSaleId: afterSale.id,
        orderId: order.id
      });
    }

    res.status(201).json({ afterSale });
  } catch (error) {
    console.error('Create after-sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/after-sales/:id', [
  body('status').optional().isIn(['pending', 'processing', 'completed', 'rejected']),
  body('action').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const afterSale = await AfterSale.findByPk(req.params.id);

    if (!afterSale) {
      return res.status(404).json({ error: 'After-sale record not found' });
    }

    const { status, notes } = req.body;
    const oldStatus = afterSale.status;

    if (status) {
      afterSale.status = status;
    }

    const chain = afterSale.processing_chain || [];
    chain.push({
      action: status ? 'status_change' : 'update',
      message: status ? `Status changed from ${oldStatus} to ${status}` : 'Record updated',
      timestamp: new Date().toISOString(),
      operator: req.user.name || req.user.username,
      notes
    });
    afterSale.processing_chain = chain;

    await afterSale.save();

    if (status === 'completed' && afterSale.type === 'refund') {
      const order = await Order.findByPk(afterSale.order_id);
      if (order) {
        order.payment_status = 'refunded';
        await order.save();
      }
    }

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'update_after_sale',
      target: 'after_sale',
      target_id: afterSale.id,
      message: `Updated after-sale record`,
      details: { oldStatus, newStatus: status, notes }
    });

    if (req.io) {
      req.io.to('user:operation').emit('after_sale:updated', {
        afterSaleId: afterSale.id,
        status: afterSale.status
      });
    }

    res.json({ afterSale });
  } catch (error) {
    console.error('Update after-sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;