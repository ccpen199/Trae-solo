const express = require('express');
const { Arbitration, Order, User } = require('../models');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (status) where.status = status;

  try {
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;
    const { rows, count } = await Arbitration.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: Order, as: 'order', attributes: ['id', 'order_no', 'total_amount'], required: false },
        { model: User, as: 'initiator', attributes: ['id', 'phone'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ list: rows.map(mapArbitration), total: count, page: parseInt(page, 10), pageSize: limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { orderId, reason } = req.body;
  if (!orderId || !reason) return res.status(400).json({ error: 'orderId 和 reason 必填' });

  try {
    const arbitration = await Arbitration.create({
      order_id: orderId,
      initiator_id: req.user.userId,
      reason,
    });
    res.status(201).json(mapArbitration(arbitration));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const status = req.body.status || 'resolved';
  const { resolution } = req.body;
  if (!['resolved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '状态必须为 resolved 或 rejected' });
  }

  try {
    const arbitration = await Arbitration.findByPk(req.params.id);
    if (!arbitration) return res.status(404).json({ error: '仲裁记录不存在' });

    await arbitration.update({
      status,
      resolution: resolution || null,
      handler: req.user.userId,
      handle_at: new Date(),
    });
    res.json(mapArbitration(arbitration));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapArbitration(row) {
  const a = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    ...a,
    orderId: a.order_id,
    orderNo: a.order?.order_no,
    orderInfo: a.order ? `${a.order.order_no} / ¥${a.order.total_amount}` : '',
    initiatorId: a.initiator_id,
    initiatorPhone: a.initiator?.phone,
    handleAt: a.handle_at,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

module.exports = router;
