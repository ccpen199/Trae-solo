const express = require('express');
const db = require('../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { city, merchant_id, activity_type, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE a.status = 1';
  const params = [];
  
  if (city) {
    where += ' AND a.city = ?';
    params.push(city);
  }
  
  if (merchant_id) {
    where += ' AND a.merchant_id = ?';
    params.push(merchant_id);
  }
  
  if (activity_type) {
    where += ' AND a.activity_type = ?';
    params.push(activity_type);
  }
  
  const activities = db.prepare(`
    SELECT a.*, m.company_name, m.logo as merchant_logo
    FROM marketing_activities a
    LEFT JOIN merchants m ON a.merchant_id = m.id
    ${where}
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM marketing_activities a ${where}`).get(...params).count;
  
  res.json({ data: activities, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const activity = db.prepare(`
    SELECT a.*, m.company_name, m.logo as merchant_logo, m.city as merchant_city
    FROM marketing_activities a
    LEFT JOIN merchants m ON a.merchant_id = m.id
    WHERE a.id = ? AND a.status = 1
  `).get(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }
  
  res.json(activity);
});

router.post('/', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  if (!merchant) {
    return res.status(404).json({ error: '商家信息不存在' });
  }
  
  const { title, description, activity_type, start_date, end_date, city, discount, gift, cover_image } = req.body;
  
  if (!title || !activity_type || !start_date || !end_date) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  
  const result = db.prepare(`
    INSERT INTO marketing_activities 
    (merchant_id, title, description, activity_type, start_date, end_date, city, discount, gift, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    merchant.id, title, description, activity_type, start_date, end_date,
    city || merchant.city, discount, gift, cover_image
  );
  
  res.status(201).json({ id: result.lastInsertRowid, message: '活动创建成功' });
});

router.put('/:id', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  const activity = db.prepare('SELECT * FROM marketing_activities WHERE id = ? AND merchant_id = ?').get(req.params.id, merchant?.id);
  
  if (!activity) {
    return res.status(404).json({ error: '活动不存在或无权限修改' });
  }
  
  const { title, description, activity_type, start_date, end_date, city, discount, gift, cover_image, status } = req.body;
  
  db.prepare(`
    UPDATE marketing_activities 
    SET title = ?, description = ?, activity_type = ?, start_date = ?, end_date = ?, 
        city = ?, discount = ?, gift = ?, cover_image = ?, status = ?
    WHERE id = ?
  `).run(
    title, description, activity_type, start_date, end_date,
    city, discount, gift, cover_image, status ?? activity.status,
    req.params.id
  );
  
  res.json({ message: '活动更新成功' });
});

router.delete('/:id', auth(['merchant']), (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id);
  const activity = db.prepare('SELECT * FROM marketing_activities WHERE id = ? AND merchant_id = ?').get(req.params.id, merchant?.id);
  
  if (!activity) {
    return res.status(404).json({ error: '活动不存在或无权限删除' });
  }
  
  db.prepare('UPDATE marketing_activities SET status = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '活动删除成功' });
});

module.exports = router;
