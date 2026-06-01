const express = require('express');
const db = require('../models/database');
const alertService = require('../services/alertService');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    
    let sql = `
      SELECT s.*, e.subject, c.name as customer_name, c.email as customer_email,
             u.name as sent_by_name
      FROM send_records s
      JOIN email_generations e ON s.generation_id = e.id
      JOIN customer_profiles c ON e.customer_id = c.id
      JOIN users u ON s.sent_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY s.sent_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    
    const records = await db.all(sql, params);
    const total = await db.get('SELECT COUNT(*) as count FROM send_records');
    
    res.json({ data: records, total: total.count });
  } catch (error) {
    res.status(500).json({ error: '获取发送记录失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await db.get(`
      SELECT s.*, e.subject, e.content, c.name as customer_name, c.email as customer_email,
             u.name as sent_by_name
      FROM send_records s
      JOIN email_generations e ON s.generation_id = e.id
      JOIN customer_profiles c ON e.customer_id = c.id
      JOIN users u ON s.sent_by = u.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (!record) {
      return res.status(404).json({ error: '发送记录不存在' });
    }
    
    const replies = await db.all(`
      SELECT r.*, u.name as classified_by_name
      FROM reply_classifications r
      LEFT JOIN users u ON r.classified_by = u.id
      WHERE r.send_record_id = ?
    `, [req.params.id]);
    
    res.json({ ...record, replies });
  } catch (error) {
    res.status(500).json({ error: '获取发送记录详情失败' });
  }
});

router.post('/:id/classify', async (req, res) => {
  try {
    const { reply_content, classification, confidence } = req.body;
    
    const result = await db.run(
      'INSERT INTO reply_classifications (send_record_id, reply_content, classification, confidence, classified_by, is_manual) VALUES (?, ?, ?, ?, ?, 1)',
      [req.params.id, reply_content, classification, confidence || 1, req.user.id]
    );

    const reply = { id: result.lastID, confidence: confidence || 1 };
    await alertService.checkReplyClassification(reply);

    res.json({ id: result.lastID, message: '分类成功' });
  } catch (error) {
    res.status(500).json({ error: '分类失败' });
  }
});

module.exports = router;
