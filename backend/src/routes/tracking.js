const express = require('express');
const db = require('../db/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

const EXPRESS_COMPANIES = [
  { code: 'sf', name: '顺丰速运' },
  { code: 'jd', name: '京东物流' },
  { code: 'yto', name: '圆通速递' },
  { code: 'zto', name: '中通快递' },
  { code: 'sto', name: '申通快递' },
  { code: 'yunda', name: '韵达快递' },
  { code: 'ems', name: 'EMS' },
  { code: 'best', name: '百世快递' }
];

router.get('/companies', (req, res) => {
  res.json({ companies: EXPRESS_COMPANIES });
});

router.post('/bind', authenticateToken, (req, res) => {
  const { order_id, express_company, tracking_no } = req.body;

  if (!order_id || !express_company || !tracking_no) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (req.user.type === 'shipper' && order.shipper_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此订单' });
  }

  const existing = db.prepare('SELECT id FROM express_tracking WHERE order_id = ?').get(order_id);
  
  if (existing) {
    db.prepare(`
      UPDATE express_tracking 
      SET express_company = ?, tracking_no = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `).run(express_company, tracking_no, order_id);
  } else {
    db.prepare(`
      INSERT INTO express_tracking (order_id, express_company, tracking_no)
      VALUES (?, ?, ?)
    `).run(order_id, express_company, tracking_no);
  }

  res.json({ success: true, message: '运单号绑定成功' });
});

router.get('/order/:order_id', authenticateToken, (req, res) => {
  const { order_id } = req.params;

  const tracking = db.prepare(`
    SELECT * FROM express_tracking WHERE order_id = ?
  `).get(order_id);

  if (!tracking) {
    return res.json({ tracking: null });
  }

  const mockTrackData = [
    { time: new Date().toISOString(), status: '运输中', location: '北京市朝阳区', desc: '快件已到达北京转运中心' },
    { time: new Date(Date.now() - 3600000).toISOString(), status: '运输中', location: '天津市', desc: '快件已从天津发出' },
    { time: new Date(Date.now() - 7200000).toISOString(), status: '已揽收', location: '天津市南开区', desc: '快递员已揽收' }
  ];

  res.json({
    tracking: {
      ...tracking,
      track_data: tracking.track_data ? JSON.parse(tracking.track_data) : mockTrackData
    }
  });
});

router.get('/aggregate', authenticateToken, (req, res) => {
  const { order_ids } = req.query;
  
  if (!order_ids) {
    return res.status(400).json({ error: '请提供订单ID' });
  }

  const ids = order_ids.split(',');
  const placeholders = ids.map(() => '?').join(',');
  
  const trackings = db.prepare(`
    SELECT et.*, o.order_no
    FROM express_tracking et
    JOIN orders o ON et.order_id = o.id
    WHERE et.order_id IN (${placeholders})
  `).all(...ids);

  res.json({
    trackings: trackings.map(t => ({
      ...t,
      track_data: t.track_data ? JSON.parse(t.track_data) : null
    }))
  });
});

module.exports = router;
