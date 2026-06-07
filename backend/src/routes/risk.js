const express = require('express');
const { RiskEventLog, User, Order } = require('../models');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/events', authMiddleware, async (req, res) => {
  const { severity, handled, eventType, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (severity) where.severity = severity;
  if (handled !== undefined) where.handled = handled === 'true';
  if (eventType) where.event_type = eventType;

  try {
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;
    const { rows, count } = await RiskEventLog.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: User, as: 'user', attributes: ['id', 'phone'], required: false },
        { model: Order, as: 'order', attributes: ['id', 'order_no', 'total_amount'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ list: rows.map(mapRiskEvent), total: count, page: parseInt(page, 10), pageSize: limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/events', authMiddleware, async (req, res) => {
  const { orderId, userId, eventType, severity, detail } = req.body;
  try {
    const event = await RiskEventLog.create({
      order_id: orderId || null,
      user_id: userId || null,
      event_type: eventType,
      severity: severity || 'medium',
      detail,
    });
    res.status(201).json(mapRiskEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/events/:id/handle', authMiddleware, adminOnly, async (req, res) => {
  const handleResult = req.body.handleResult || req.body.result;
  try {
    const event = await RiskEventLog.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: '风险事件不存在' });

    await event.update({ handled: true, handle_result: handleResult });
    res.json(mapRiskEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapRiskEvent(row) {
  const e = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    ...e,
    orderId: e.order_id,
    userId: e.user_id,
    eventType: e.event_type,
    userPhone: e.user?.phone,
    orderInfo: e.order ? `${e.order.order_no} / ¥${e.order.total_amount}` : '',
    handleResult: e.handle_result,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}

module.exports = router;
