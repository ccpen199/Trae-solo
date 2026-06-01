const express = require('express');
const { all, get, run } = require('../database');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const projects = await all(`
      SELECT p.*, c.name as client_name 
      FROM projects p 
      LEFT JOIN clients c ON p.client_id = c.id 
      ORDER BY p.created_at DESC
    `);
    res.json(projects);
  } catch (error) {
    console.error('获取项目列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await get(`
      SELECT p.*, c.name as client_name 
      FROM projects p 
      LEFT JOIN clients c ON p.client_id = c.id 
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json(project);
  } catch (error) {
    console.error('获取项目详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id/dashboard', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    const positions = await all('SELECT * FROM positions WHERE project_id = ?', [projectId]);
    const positionIds = positions.map(p => p.id);
    
    let applications = [];
    if (positionIds.length > 0) {
      const placeholders = positionIds.map(() => '?').join(',');
      applications = await all(
        `SELECT * FROM candidate_applications WHERE position_id IN (${placeholders})`,
        positionIds
      );
    }
    
    const stageCounts = {};
    const stages = ['screening', 'phone_interview', 'client_recommend', 'interview', 'offer', 'onboard', 'eliminated'];
    stages.forEach(stage => {
      stageCounts[stage] = applications.filter(a => a.current_stage === stage).length;
    });
    
    res.json({
      positions: positions.length,
      totalApplications: applications.length,
      stageCounts,
      activePositions: positions.filter(p => p.status === 'open').length
    });
  } catch (error) {
    console.error('获取项目看板错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const { client_id, name, description, recruitment_target, start_date, end_date, settlement_method } = req.body;
    
    const result = await run(
      `INSERT INTO projects (client_id, name, description, recruitment_target, start_date, end_date, settlement_method, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_id, name, description, recruitment_target, start_date, end_date, settlement_method, req.user.id]
    );

    const project = await get('SELECT * FROM projects WHERE id = ?', [result.lastID]);
    res.status(201).json(project);
  } catch (error) {
    console.error('创建项目错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/:id', requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const { client_id, name, description, recruitment_target, start_date, end_date, settlement_method, status } = req.body;
    
    await run(
      `UPDATE projects SET client_id = ?, name = ?, description = ?, recruitment_target = ?, start_date = ?, end_date = ?, settlement_method = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [client_id, name, description, recruitment_target, start_date, end_date, settlement_method, status, req.params.id]
    );

    const project = await get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(project);
  } catch (error) {
    console.error('更新项目错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
