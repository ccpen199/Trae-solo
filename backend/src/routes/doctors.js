const express = require('express');
const { get, all, run } = require('../database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { department, keyword, page = 1, limit = 10 } = req.query;
    let sql = 'SELECT * FROM doctors WHERE 1=1';
    const params = [];

    if (department) {
      sql += ' AND department = ?';
      params.push(department);
    }
    if (keyword) {
      sql += ' AND (name LIKE ? OR specialties LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const offset = (page - 1) * limit;
    sql += ` ORDER BY consultation_count DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const doctors = await all(sql, params);
    
    let countSql = 'SELECT COUNT(*) as count FROM doctors WHERE 1=1';
    const countParams = [];
    if (department) {
      countSql += ' AND department = ?';
      countParams.push(department);
    }
    if (keyword) {
      countSql += ' AND (name LIKE ? OR specialties LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    const total = await get(countSql, countParams);

    res.json({ success: true, data: { list: doctors, total: total.count, page: parseInt(page) } });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, message: '获取医生列表失败' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const doctor = await get('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (!doctor) {
      return res.status(404).json({ success: false, message: '医生不存在' });
    }

    const hospital = await get('SELECT * FROM hospitals WHERE id = ?', [doctor.hospital_id]);
    const reviews = await all(`
      SELECT c.*, u.nickname, u.avatar 
      FROM consultations c
      JOIN users u ON c.user_id = u.id
      WHERE c.doctor_id = ? AND c.status = 'completed' AND c.review IS NOT NULL
      ORDER BY c.completed_at DESC LIMIT 5
    `, [req.params.id]);

    res.json({ success: true, data: { ...doctor, hospital: hospital || null, reviews } });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ success: false, message: '获取医生详情失败' });
  }
});

router.post('/:id/consultation', authenticateToken, async (req, res) => {
  try {
    const { type, question, images } = req.body;
    const doctorId = req.params.id;

    const result = await run(`
      INSERT INTO consultations (user_id, doctor_id, type, question, images, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, doctorId, type, question || '', images ? JSON.stringify(images) : null, 'pending']);

    if (question) {
      await run(`
        INSERT INTO consultation_messages (consultation_id, sender_id, sender_type, content, images)
        VALUES (?, ?, ?, ?, ?)
      `, [result.lastID, req.user.id, 'user', question, images ? JSON.stringify(images) : null]);
    }

    res.json({ success: true, data: { id: result.lastID }, message: '问诊已提交' });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ success: false, message: '提交问诊失败' });
  }
});

module.exports = router;
