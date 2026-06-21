const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }

  const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates WHERE user_id = ?').get(id).count;
  const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE user_id = ?').get(id).count;

  res.json({
    code: 200,
    data: {
      ...user,
      cert_count: certCount,
      appointment_count: appointmentCount
    }
  });
});

router.post('/elder-mode/toggle', (req, res) => {
  const { userId, enabled } = req.body;

  db.prepare('UPDATE users SET is_elder = ?, updated_at = datetime("now", "localtime") WHERE id = ?')
    .run(enabled ? 1 : 0, userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  res.json({
    code: 200,
    data: {
      is_elder: user.is_elder,
      message: enabled ? '已开启长辈模式' : '已关闭长辈模式'
    }
  });
});

router.get('/elder-mode/config', (req, res) => {
  res.json({
    code: 200,
    data: {
      font_size: 'large',
      simplified_ui: true,
      voice_input: true,
      no_popups: true,
      direct_agent: true,
      high_contrast: true,
      features: [
        { id: 'voice_input', name: '语音输入', icon: '🎤', enabled: true },
        { id: 'direct_agent', name: '人工坐席直连', icon: '👩‍💼', enabled: true },
        { id: 'large_font', name: '超大字体', icon: '🔍', enabled: true },
        { id: 'no_ads', name: '无广告弹窗', icon: '🚫', enabled: true },
        { id: 'simplified', name: '简化界面', icon: '📱', enabled: true },
      ]
    }
  });
});

router.post('/appointments', (req, res) => {
  const { userId, outletId, serviceItemId, date, time } = req.body;

  const existing = db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE user_id = ? AND outlet_id = ? AND appointment_date = ? AND appointment_time = ?
  `).get(userId, outletId, date, time).count;

  if (existing > 0) {
    return res.status(400).json({ code: 400, message: '该时段已预约' });
  }

  const dayCount = db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE outlet_id = ? AND appointment_date = ?
  `).get(outletId, date).count;

  const queueNumber = dayCount + 1;

  const result = db.prepare(`
    INSERT INTO appointments (user_id, outlet_id, service_item_id, appointment_date, appointment_time, queue_number, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(userId, outletId, serviceItemId, date, time, queueNumber);

  res.json({
    code: 200,
    data: {
      id: result.lastInsertRowid,
      queue_number: queueNumber,
      message: '预约成功'
    }
  });
});

router.get('/appointments/:userId', (req, res) => {
  const { userId } = req.params;
  const { status, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT a.*, so.name as outlet_name, si.name as service_name
    FROM appointments a
    LEFT JOIN service_outlets so ON a.outlet_id = so.id
    LEFT JOIN service_items si ON a.service_item_id = si.id
    WHERE a.user_id = ?
  `;
  const params = [userId];

  if (status && status !== 'all') {
    sql += ' AND a.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const list = db.prepare(sql).all(...params);

  res.json({ code: 200, data: list, total: list.length });
});

module.exports = router;
