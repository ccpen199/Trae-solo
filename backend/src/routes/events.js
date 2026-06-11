const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { category, city, page = 1, limit = 20, keyword } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM events WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (city) {
    query += ' AND city = ?';
    params.push(city);
  }

  if (keyword) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, events) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }

    db.get('SELECT COUNT(*) as total FROM events WHERE 1=1', (err, result) => {
      res.json({ events, total: result.total, page: parseInt(page), limit: parseInt(limit) });
    });
  });
});

router.get('/hot', (req, res) => {
  db.all('SELECT * FROM events WHERE is_hot = 1 LIMIT 8', (err, events) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    res.json({ events });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM events WHERE id = ?', [req.params.id], (err, event) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }
    res.json({ event });
  });
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { title, category, sub_category, description, poster, venue, address, city, start_time, end_time, organizer, tags } = req.body;

  db.run(
    `INSERT INTO events (title, category, sub_category, description, poster, venue, address, city, start_time, end_time, organizer, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, category, sub_category, description, poster, venue, address, city, start_time, end_time, organizer, tags],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建失败' });
      }
      res.status(201).json({ id: this.lastID, message: '创建成功' });
    }
  );
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const fields = ['title', 'category', 'sub_category', 'description', 'poster', 'venue', 'address', 'city', 'start_time', 'end_time', 'organizer', 'status', 'is_hot', 'tags'];
  const updates = [];
  const values = [];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  values.push(req.params.id);

  db.run(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: '更新失败' });
    }
    res.json({ message: '更新成功' });
  });
});

module.exports = router;
