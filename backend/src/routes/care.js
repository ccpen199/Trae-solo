const express = require('express');
const { all, get, run } = require('../database/db');
const { authenticateToken, requireRoles, canAccessElderly } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/plans', async (req, res) => {
  try {
    let plans;
    if (req.user.role === 'family') {
      plans = await all(`
        SELECT cp.*, e.name as elderly_name, u.name as creator_name
        FROM care_plans cp
        JOIN elderly e ON cp.elderly_id = e.id
        JOIN family_access fa ON e.id = fa.elderly_id
        LEFT JOIN users u ON cp.created_by = u.id
        WHERE fa.family_member_id = ? AND cp.is_active = 1
        ORDER BY cp.created_at DESC
      `, [req.user.id]);
    } else {
      plans = await all(`
        SELECT cp.*, e.name as elderly_name, u.name as creator_name
        FROM care_plans cp
        JOIN elderly e ON cp.elderly_id = e.id
        LEFT JOIN users u ON cp.created_by = u.id
        ORDER BY cp.created_at DESC
      `);
    }
    res.json(plans);
  } catch (error) {
    console.error('获取照护计划错误:', error);
    res.status(500).json({ error: '获取照护计划失败' });
  }
});

router.get('/plans/elderly/:elderlyId', canAccessElderly, async (req, res) => {
  try {
    const plans = await all(`
      SELECT cp.*, u.name as creator_name
      FROM care_plans cp
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.elderly_id = ?
      ORDER BY cp.created_at DESC
    `, [req.params.elderlyId]);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: '获取照护计划失败' });
  }
});

router.post('/plans', requireRoles('admin', 'nurse'), async (req, res) => {
  try {
    const { elderly_id, plan_name, task_type, frequency, time_points, description } = req.body;
    const result = await run(`
      INSERT INTO care_plans (elderly_id, plan_name, task_type, frequency, time_points, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [elderly_id, plan_name, task_type, frequency, time_points, description, req.user.id]);

    res.json({ id: result.lastID, message: '照护计划创建成功' });
  } catch (error) {
    console.error('创建照护计划错误:', error);
    res.status(500).json({ error: '创建照护计划失败' });
  }
});

router.put('/plans/:id', requireRoles('admin', 'nurse'), async (req, res) => {
  try {
    const { plan_name, task_type, frequency, time_points, description, is_active } = req.body;
    await run(`
      UPDATE care_plans 
      SET plan_name = ?, task_type = ?, frequency = ?, time_points = ?, description = ?, is_active = ?
      WHERE id = ?
    `, [plan_name, task_type, frequency, time_points, description, is_active, req.params.id]);

    res.json({ message: '照护计划更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新照护计划失败' });
  }
});

router.get('/records', async (req, res) => {
  try {
    let records;
    const limit = req.query.limit || 50;
    
    if (req.user.role === 'family') {
      records = await all(`
        SELECT cr.*, e.name as elderly_name, u.name as executor_name
        FROM care_records cr
        JOIN elderly e ON cr.elderly_id = e.id
        JOIN family_access fa ON e.id = fa.elderly_id
        LEFT JOIN users u ON cr.executed_by = u.id
        WHERE fa.family_member_id = ?
        ORDER BY cr.executed_at DESC
        LIMIT ?
      `, [req.user.id, limit]);
    } else {
      records = await all(`
        SELECT cr.*, e.name as elderly_name, u.name as executor_name
        FROM care_records cr
        JOIN elderly e ON cr.elderly_id = e.id
        LEFT JOIN users u ON cr.executed_by = u.id
        ORDER BY cr.executed_at DESC
        LIMIT ?
      `, [limit]);
    }
    res.json(records);
  } catch (error) {
    console.error('获取护理记录错误:', error);
    res.status(500).json({ error: '获取护理记录失败' });
  }
});

router.get('/records/elderly/:elderlyId', canAccessElderly, async (req, res) => {
  try {
    const records = await all(`
      SELECT cr.*, u.name as executor_name
      FROM care_records cr
      LEFT JOIN users u ON cr.executed_by = u.id
      WHERE cr.elderly_id = ?
      ORDER BY cr.executed_at DESC
    `, [req.params.elderlyId]);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取护理记录失败' });
  }
});

router.post('/records', requireRoles('admin', 'nurse', 'caregiver'), async (req, res) => {
  try {
    const { plan_id, elderly_id, task_type, status, notes, abnormality } = req.body;
    const result = await run(`
      INSERT INTO care_records (plan_id, elderly_id, task_type, executed_by, status, notes, abnormality)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [plan_id, elderly_id, task_type, req.user.id, status || '已完成', notes, abnormality]);

    res.json({ id: result.lastID, message: '护理记录创建成功' });
  } catch (error) {
    console.error('创建护理记录错误:', error);
    res.status(500).json({ error: '创建护理记录失败' });
  }
});

router.get('/today-tasks', async (req, res) => {
  try {
    const tasks = await all(`
      SELECT cp.*, e.name as elderly_name, e.room_number, e.bed_number
      FROM care_plans cp
      JOIN elderly e ON cp.elderly_id = e.id
      WHERE cp.is_active = 1
      ORDER BY e.room_number, e.bed_number
    `);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: '获取今日任务失败' });
  }
});

module.exports = router;
