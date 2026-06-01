const express = require('express');
const { all, get, run } = require('../database/db');
const { authenticateToken, requireRoles, canAccessElderly } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    let incidents;
    if (req.user.role === 'family') {
      incidents = await all(`
        SELECT i.*, e.name as elderly_name, u1.name as reporter_name, u2.name as handler_name
        FROM incidents i
        JOIN elderly e ON i.elderly_id = e.id
        JOIN family_access fa ON e.id = fa.elderly_id
        LEFT JOIN users u1 ON i.reported_by = u1.id
        LEFT JOIN users u2 ON i.handled_by = u2.id
        WHERE fa.family_member_id = ?
        ORDER BY i.occurred_at DESC
      `, [req.user.id]);
    } else {
      incidents = await all(`
        SELECT i.*, e.name as elderly_name, u1.name as reporter_name, u2.name as handler_name
        FROM incidents i
        JOIN elderly e ON i.elderly_id = e.id
        LEFT JOIN users u1 ON i.reported_by = u1.id
        LEFT JOIN users u2 ON i.handled_by = u2.id
        ORDER BY i.occurred_at DESC
      `);
    }
    res.json(incidents);
  } catch (error) {
    console.error('获取异常事件错误:', error);
    res.status(500).json({ error: '获取异常事件失败' });
  }
});

router.get('/elderly/:elderlyId', canAccessElderly, async (req, res) => {
  try {
    const incidents = await all(`
      SELECT i.*, u1.name as reporter_name, u2.name as handler_name
      FROM incidents i
      LEFT JOIN users u1 ON i.reported_by = u1.id
      LEFT JOIN users u2 ON i.handled_by = u2.id
      WHERE i.elderly_id = ?
      ORDER BY i.occurred_at DESC
    `, [req.params.elderlyId]);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: '获取异常事件失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { elderly_id, incident_type, severity, description } = req.body;
    const result = await run(`
      INSERT INTO incidents (elderly_id, incident_type, severity, description, reported_by)
      VALUES (?, ?, ?, ?, ?)
    `, [elderly_id, incident_type, severity, description, req.user.id]);

    const staffUsers = await all(`
      SELECT id FROM users WHERE role IN ('admin', 'nurse')
    `);
    
    for (const user of staffUsers) {
      await run(`
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (?, 'incident', ?, ?)
      `, [user.id, `新异常事件: ${incident_type}`, description.substring(0, 100)]);
    }

    res.json({ id: result.lastID, message: '异常事件上报成功' });
  } catch (error) {
    console.error('上报异常事件错误:', error);
    res.status(500).json({ error: '上报异常事件失败' });
  }
});

router.put('/:id', requireRoles('admin', 'nurse'), async (req, res) => {
  try {
    const { status, handling_notes, family_notified } = req.body;
    await run(`
      UPDATE incidents 
      SET status = ?, handled_by = ?, handling_notes = ?, family_notified = ?
      WHERE id = ?
    `, [status, req.user.id, handling_notes, family_notified, req.params.id]);

    res.json({ message: '异常事件更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新异常事件失败' });
  }
});

router.get('/pending', requireRoles('admin', 'nurse', 'caregiver'), async (req, res) => {
  try {
    const pending = await all(`
      SELECT i.*, e.name as elderly_name, u.name as reporter_name
      FROM incidents i
      JOIN elderly e ON i.elderly_id = e.id
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.status IN ('待处理', '处理中')
      ORDER BY 
        CASE i.severity 
          WHEN '紧急' THEN 1 
          WHEN '严重' THEN 2 
          WHEN '一般' THEN 3 
          ELSE 4 
        END,
        i.occurred_at DESC
    `);
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: '获取待处理事件失败' });
  }
});

module.exports = router;
