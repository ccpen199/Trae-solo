const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const userId = req.user.id;
    
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM declarations ${whereClause}`;
    const countResult = await db.get(countQuery, params);
    
    const query = `
      SELECT 
        d.id,
        d.declaration_no,
        d.policy_id,
        d.policy_title,
        d.policy_code,
        d.enterprise_id,
        d.enterprise_name,
        d.status,
        d.progress,
        d.current_stage,
        d.apply_amount,
        d.contact_person,
        d.contact_phone,
        d.submit_time,
        d.reject_reason
      FROM declarations d
      ${whereClause}
      ORDER BY d.submit_time DESC
      LIMIT ? OFFSET ?
    `;
    
    const list = await db.query(query, [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]);
    
    const resultList = await Promise.all(list.map(async item => {
      const timelineQuery = `
        SELECT time, title, status
        FROM declaration_timeline
        WHERE declaration_id = ?
        ORDER BY id ASC
      `;
      const timeline = await db.query(timelineQuery, [item.id]);
      
      return {
        ...item,
        timeline
      };
    }));
    
    res.json({
      list: resultList,
      total: countResult.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM declarations 
      WHERE user_id = ?
    `;
    
    const result = await db.get(query, [userId]);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        d.*,
        p.title as policy_title,
        p.code as policy_code
      FROM declarations d
      LEFT JOIN policies p ON d.policy_id = p.id
      WHERE d.id = ?
    `;
    
    const declaration = await db.get(query, [id]);
    if (!declaration) {
      return res.status(404).json({ error: '申报记录不存在' });
    }
    
    const timelineQuery = `
      SELECT time, title, status, description
      FROM declaration_timeline
      WHERE declaration_id = ?
      ORDER BY id ASC
    `;
    const timeline = await db.query(timelineQuery, [id]);
    
    res.json({
      ...declaration,
      timeline
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/withdraw', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const declaration = await db.get('SELECT * FROM declarations WHERE id = ? AND user_id = ?', [id, userId]);
    if (!declaration) {
      return res.status(404).json({ error: '申报记录不存在' });
    }
    
    if (declaration.status !== 'pending' && declaration.status !== 'reviewing') {
      return res.status(400).json({ error: '当前状态不可撤回' });
    }
    
    await db.run('UPDATE declarations SET status = "withdrawn" WHERE id = ?', [id]);
    
    await db.run(`
      INSERT INTO declaration_timeline (declaration_id, time, title, status)
      VALUES (?, ?, '用户撤回', 'withdrawn')
    `, [id, new Date().toISOString()]);
    
    res.json({ message: '撤回成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
