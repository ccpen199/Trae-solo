const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Order, SubOrder, User, ServiceProvider } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const fulfillmentCenter = require('../services/fulfillmentCenter');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const { status, userId, category, city, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (userId) where.user_id = userId;
  if (category) where.category = category;
  if (city) where.city = city;

  const limit = parseInt(pageSize, 10);
  const offset = (parseInt(page, 10) - 1) * limit;

  try {
    const { rows, count } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: User, as: 'user', attributes: ['id', 'phone', 'real_name'], required: false },
        { model: ServiceProvider, as: 'provider', attributes: ['id', 'name'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ list: rows.map(mapOrder), total: count, page: parseInt(page, 10), pageSize: limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { providerId, category, totalAmount, payMethod, city, remark, subOrders } = req.body;
  try {
    const order = await Order.create({
      order_no: `ORD-${Date.now()}-${uuidv4().slice(0, 6)}`,
      user_id: req.user.userId,
      provider_id: providerId,
      category,
      total_amount: totalAmount,
      pay_method: payMethod || 'wallet',
      city,
      remark,
    });

    if (Array.isArray(subOrders) && subOrders.length) {
      const subs = subOrders.map((s) => ({
        order_id: order.id,
        type: s.type,
        amount: s.amount,
        status: 'pending',
      }));
      await SubOrder.bulkCreate(subs);
    }

    const result = await Order.findByPk(order.id, { include: [{ model: SubOrder, as: 'subOrders' }] });
    res.status(201).json(mapOrder(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: SubOrder, as: 'subOrders' }],
    });
    if (!order) return res.status(404).json({ error: '订单不存在' });
    res.json(mapOrder(order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: '订单不存在' });
    if (!['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({ error: '当前订单状态不允许取消' });
    }
    await order.update({ status: 'cancelled' });
    res.json(mapOrder(order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/fulfill', authMiddleware, async (req, res) => {
  try {
    const result = await fulfillmentCenter.fulfillOrder(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

function mapSubOrder(row) {
  const s = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    ...s,
    orderId: s.order_id,
    thirdPartyNo: s.third_party_no,
    thirdPartyResp: s.third_party_resp,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

function mapOrder(row) {
  const o = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    ...o,
    orderNo: o.order_no,
    userId: o.user_id,
    userPhone: o.user?.phone,
    userName: o.user?.real_name,
    providerId: o.provider_id,
    providerName: o.provider?.name,
    totalAmount: o.total_amount,
    payMethod: o.pay_method,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    subOrders: Array.isArray(o.subOrders) ? o.subOrders.map(mapSubOrder) : undefined,
  };
}

module.exports = router;
