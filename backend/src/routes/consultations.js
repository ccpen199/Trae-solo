const express = require('express');
const { run, get, all } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { doctor_id, type, question, images } = req.body;
    const user_id = req.user.id;

    if (!doctor_id || !type) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const result = await run(
      'INSERT INTO consultations (user_id, doctor_id, type, question, images, status) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, doctor_id, type, question || '', images ? JSON.stringify(images) : null, 'pending']
    );

    const consultation = await get(
      `SELECT c.*, d.name as doctor_name, d.avatar as doctor_avatar, d.department, u.nickname as user_name 
       FROM consultations c 
       LEFT JOIN doctors d ON c.doctor_id = d.id 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [result.lastID]
    );

    if (question) {
      await run(
        'INSERT INTO consultation_messages (consultation_id, sender_id, sender_type, content, images) VALUES (?, ?, ?, ?, ?)',
        [result.lastID, user_id, 'user', question, images ? JSON.stringify(images) : null]
      );
    }

    res.json({ success: true, data: consultation, message: '咨询创建成功' });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ success: false, message: '创建咨询失败' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const user_id = req.user.id;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE c.user_id = ?';
    let params = [user_id];

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    const consultations = await all(
      `SELECT c.*, d.name as doctor_name, d.avatar as doctor_avatar, d.department,
       (SELECT COUNT(*) FROM consultation_messages WHERE consultation_id = c.id AND sender_type = 'doctor' AND is_read = 0) as unread_count
       FROM consultations c 
       LEFT JOIN doctors d ON c.doctor_id = d.id 
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    const totalResult = await get(
      `SELECT COUNT(*) as count FROM consultations c ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: consultations,
        total: totalResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({ success: false, message: '获取咨询列表失败' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const consultation = await get(
      `SELECT c.*, d.name as doctor_name, d.avatar as doctor_avatar, d.department, d.hospital_address,
       u.nickname as user_name, u.avatar as user_avatar
       FROM consultations c 
       LEFT JOIN doctors d ON c.doctor_id = d.id 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [id, user_id]
    );

    if (!consultation) {
      return res.status(404).json({ success: false, message: '咨询不存在' });
    }

    const messages = await all(
      `SELECT * FROM consultation_messages WHERE consultation_id = ? ORDER BY created_at ASC`,
      [id]
    );

    await run(
      `UPDATE consultation_messages SET is_read = 1 WHERE consultation_id = ? AND sender_type = 'doctor'`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...consultation,
        messages: messages
      }
    });
  } catch (error) {
    console.error('Get consultation detail error:', error);
    res.status(500).json({ success: false, message: '获取咨询详情失败' });
  }
});

router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, images } = req.body;
    const user_id = req.user.id;

    if (!content) {
      return res.status(400).json({ success: false, message: '消息内容不能为空' });
    }

    const consultation = await get(
      'SELECT * FROM consultations WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (!consultation) {
      return res.status(404).json({ success: false, message: '咨询不存在' });
    }

    const result = await run(
      'INSERT INTO consultation_messages (consultation_id, sender_id, sender_type, content, images) VALUES (?, ?, ?, ?, ?)',
      [id, user_id, 'user', content, images ? JSON.stringify(images) : null]
    );

    const message = await get(
      'SELECT * FROM consultation_messages WHERE id = ?',
      [result.lastID]
    );

    res.json({ success: true, data: message, message: '消息发送成功' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: '发送消息失败' });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;

    const consultation = await get(
      'SELECT * FROM consultations WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (!consultation) {
      return res.status(404).json({ success: false, message: '咨询不存在' });
    }

    await run(
      'UPDATE consultations SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: '更新状态失败' });
  }
});

module.exports = router;
