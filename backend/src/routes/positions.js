const express = require('express');
const { all, get, run } = require('../database');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    let sql = `
      SELECT p.*, pr.name as project_name, c.name as client_name 
      FROM positions p 
      LEFT JOIN projects pr ON p.project_id = pr.id 
      LEFT JOIN clients c ON pr.client_id = c.id 
    `;
    let params = [];
    
    if (project_id) {
      sql += ' WHERE p.project_id = ?';
      params.push(project_id);
    }
    
    sql += ' ORDER BY p.created_at DESC';
    
    const positions = await all(sql, params);
    res.json(positions);
  } catch (error) {
    console.error('获取岗位列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const position = await get(`
      SELECT p.*, pr.name as project_name, c.name as client_name 
      FROM positions p 
      LEFT JOIN projects pr ON p.project_id = pr.id 
      LEFT JOIN clients c ON pr.client_id = c.id 
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (!position) {
      return res.status(404).json({ error: '岗位不存在' });
    }
    res.json(position);
  } catch (error) {
    console.error('获取岗位详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', requireRoles('admin', 'manager', 'consultant'), async (req, res) => {
  try {
    const { project_id, title, department, job_description, requirements, headcount, salary_range, location, batch, priority } = req.body;
    
    const result = await run(
      `INSERT INTO positions (project_id, title, department, job_description, requirements, headcount, salary_range, location, batch, priority, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, title, department, job_description, requirements, headcount || 1, salary_range, location, batch, priority || 'normal', req.user.id]
    );

    const position = await get('SELECT * FROM positions WHERE id = ?', [result.lastID]);
    res.status(201).json(position);
  } catch (error) {
    console.error('创建岗位错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/:id', requireRoles('admin', 'manager', 'consultant'), async (req, res) => {
  try {
    const { title, department, job_description, requirements, headcount, salary_range, location, batch, status, priority } = req.body;
    
    await run(
      `UPDATE positions SET title = ?, department = ?, job_description = ?, requirements = ?, headcount = ?, salary_range = ?, location = ?, batch = ?, status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, department, job_description, requirements, headcount, salary_range, location, batch, status, priority, req.params.id]
    );

    const position = await get('SELECT * FROM positions WHERE id = ?', [req.params.id]);
    res.json(position);
  } catch (error) {
    console.error('更新岗位错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.patch('/:id/status', requireRoles('admin', 'manager', 'consultant'), async (req, res) => {
  try {
    const { status } = req.body;
    
    await run(
      `UPDATE positions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, req.params.id]
    );

    const position = await get('SELECT * FROM positions WHERE id = ?', [req.params.id]);
    res.json(position);
  } catch (error) {
    console.error('更新岗位状态错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
