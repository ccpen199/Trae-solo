const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const db = req.app.get('db');
  const { status, type, page = 1, pageSize = 20 } = req.query;

  let sql = 'SELECT * FROM activities WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM activities WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    countSql += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND type = ?';
    countSql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, Number(pageSize), (Number(page) - 1) * Number(pageSize)];

  const activities = db.prepare(sql).all(...queryParams);
  const { total } = db.prepare(countSql).get(...params);

  res.json({ items: activities, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', (req, res) => {
  const db = req.app.get('db');
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const gifts = db.prepare(`
    SELECT ag.*, g.name, g.icon, g.price
    FROM activity_gifts ag
    LEFT JOIN gifts g ON ag.gift_id = g.id
    WHERE ag.activity_id = ?
  `).all(req.params.id);

  res.json({ ...activity, gifts });
});

router.post('/', authMiddleware(['admin', 'operator']), (req, res) => {
  const { name, type, description, start_time, end_time, discount, config, giftIds } = req.body;
  const db = req.app.get('db');

  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO activities (name, type, description, start_time, end_time, discount, config)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, type, description, start_time, end_time, discount, config || '{}');

    const activityId = result.lastInsertRowid;
    if (giftIds && giftIds.length > 0) {
      const giftStmt = db.prepare('INSERT INTO activity_gifts (activity_id, gift_id, discount_price) VALUES (?, ?, ?)');
      for (const giftId of giftIds) {
        const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(giftId);
        const discountPrice = discount ? gift.price * (1 - discount / 100) : gift.price;
        giftStmt.run(activityId, giftId, discountPrice);
      }
    }
  });

  tx();
  res.json({ success: true });
});

router.put('/:id', authMiddleware(['admin', 'operator']), (req, res) => {
  const { name, type, description, start_time, end_time, discount, config, status, giftIds } = req.body;
  const db = req.app.get('db');

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE activities 
      SET name = ?, type = ?, description = ?, start_time = ?, end_time = ?, discount = ?, config = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, type, description, start_time, end_time, discount, config || '{}', status, req.params.id);

    db.prepare('DELETE FROM activity_gifts WHERE activity_id = ?').run(req.params.id);

    if (giftIds && giftIds.length > 0) {
      const giftStmt = db.prepare('INSERT INTO activity_gifts (activity_id, gift_id, discount_price) VALUES (?, ?, ?)');
      for (const giftId of giftIds) {
        const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(giftId);
        const discountPrice = discount ? gift.price * (1 - discount / 100) : gift.price;
        giftStmt.run(req.params.id, giftId, discountPrice);
      }
    }
  });

  tx();
  res.json({ success: true });
});

router.delete('/:id', authMiddleware(['admin']), (req, res) => {
  const db = req.app.get('db');
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM activity_gifts WHERE activity_id = ?').run(req.params.id);
    db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  });

  tx();
  res.json({ success: true });
});

router.get('/preview/:id', (req, res) => {
  const db = req.app.get('db');
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const gifts = db.prepare(`
    SELECT ag.*, g.name, g.icon, g.price, g.rarity
    FROM activity_gifts ag
    LEFT JOIN gifts g ON ag.gift_id = g.id
    WHERE ag.activity_id = ?
  `).all(req.params.id);

  res.json({
    activity: {
      name: activity.name,
      type: activity.type,
      discount: activity.discount,
      start_time: activity.start_time,
      end_time: activity.end_time,
      description: activity.description
    },
    gifts
  });
});

module.exports = router;
