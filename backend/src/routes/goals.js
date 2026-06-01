const express = require('express');
const db = require('../utils/db');
const { authenticateToken, logOperation } = require('../middleware/auth');
const { calculateGoalProgress, calculateKRProgress, updateGoalStatus, updateKRStatus } = require('../utils/progress');

const router = express.Router();
router.use(authenticateToken);

const DIMENSIONS = ['事业', '健康', '财务', '学习', '关系', '其他'];

router.get('/dimensions', (req, res) => {
  res.json({ dimensions: DIMENSIONS });
});

router.get('/', (req, res) => {
  const { year, dimension } = req.query;
  const userId = req.user.id;
  
  let sql = 'SELECT * FROM goals WHERE user_id = ?';
  const params = [userId];
  
  if (year) {
    sql += ' AND year = ?';
    params.push(year);
  }
  
  if (dimension) {
    sql += ' AND dimension = ?';
    params.push(dimension);
  }
  
  sql += ' ORDER BY weight DESC, created_at DESC';
  
  const goals = db.prepare(sql).all(...params);
  
  const goalsWithProgress = goals.map(goal => ({
    ...goal,
    progress: calculateGoalProgress(goal.id),
    key_results: db.prepare('SELECT * FROM key_results WHERE goal_id = ? ORDER BY weight DESC').all(goal.id).map(kr => ({
      ...kr,
      progress: calculateKRProgress(kr.id)
    }))
  }));
  
  res.json(goalsWithProgress);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(id, userId);
  
  if (!goal) {
    return res.status(404).json({ error: '目标不存在' });
  }
  
  const keyResults = db.prepare('SELECT * FROM key_results WHERE goal_id = ? ORDER BY weight DESC').all(id).map(kr => ({
    ...kr,
    progress: calculateKRProgress(kr.id),
    milestones: db.prepare('SELECT * FROM milestones WHERE key_result_id = ? ORDER BY target_date').all(kr.id),
    deviations: db.prepare('SELECT * FROM deviation_analyses WHERE key_result_id = ? ORDER BY created_at DESC').all(kr.id),
    execution_records: db.prepare('SELECT * FROM execution_records WHERE key_result_id = ? ORDER BY record_date DESC').all(kr.id)
  }));
  
  res.json({
    ...goal,
    progress: calculateGoalProgress(id),
    key_results: keyResults
  });
});

router.post('/', (req, res) => {
  const { year, dimension, title, description, weight, deadline } = req.body;
  const userId = req.user.id;
  
  if (!year || !dimension || !title) {
    return res.status(400).json({ error: '年份、维度和标题不能为空' });
  }
  
  if (!DIMENSIONS.includes(dimension)) {
    return res.status(400).json({ error: '无效的维度' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO goals (user_id, year, dimension, title, description, weight, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(userId, year, dimension, title, description || '', weight || 1, deadline || null);
  
  logOperation(req, 'create_goal', 'goal', result.lastInsertRowid, { title, dimension, year });
  
  res.json({ id: result.lastInsertRowid, message: '目标创建成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { year, dimension, title, description, weight, status, deadline } = req.body;
  const userId = req.user.id;
  
  const goal = db.prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?').get(id, userId);
  
  if (!goal) {
    return res.status(404).json({ error: '目标不存在' });
  }
  
  if (dimension && !DIMENSIONS.includes(dimension)) {
    return res.status(400).json({ error: '无效的维度' });
  }
  
  const stmt = db.prepare(`
    UPDATE goals SET 
      year = COALESCE(?, year),
      dimension = COALESCE(?, dimension),
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      weight = COALESCE(?, weight),
      status = COALESCE(?, status),
      deadline = COALESCE(?, deadline),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);
  
  stmt.run(year, dimension, title, description, weight, status, deadline, id, userId);
  
  logOperation(req, 'update_goal', 'goal', id, { year, dimension, title, status });
  
  res.json({ id, message: '目标更新成功' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const goal = db.prepare('SELECT title FROM goals WHERE id = ? AND user_id = ?').get(id, userId);
  
  if (!goal) {
    return res.status(404).json({ error: '目标不存在' });
  }
  
  db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(id, userId);
  
  logOperation(req, 'delete_goal', 'goal', id, { title: goal.title });
  
  res.json({ message: '目标删除成功' });
});

router.post('/:goalId/key-results', (req, res) => {
  const { goalId } = req.params;
  const { title, description, target_value, unit, weight, deadline } = req.body;
  const userId = req.user.id;
  
  const goal = db.prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?').get(goalId, userId);
  
  if (!goal) {
    return res.status(404).json({ error: '目标不存在' });
  }
  
  if (!title) {
    return res.status(400).json({ error: '关键结果标题不能为空' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO key_results (goal_id, title, description, target_value, unit, weight, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(goalId, title, description || '', target_value || null, unit || '', weight || 1, deadline || null);
  
  logOperation(req, 'create_kr', 'key_result', result.lastInsertRowid, { goalId, title });
  
  res.json({ id: result.lastInsertRowid, message: '关键结果创建成功' });
});

router.put('/key-results/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, target_value, current_value, unit, weight, status, deadline } = req.body;
  const userId = req.user.id;
  
  const kr = db.prepare(`
    SELECT kr.id FROM key_results kr
    JOIN goals g ON kr.goal_id = g.id
    WHERE kr.id = ? AND g.user_id = ?
  `).get(id, userId);
  
  if (!kr) {
    return res.status(404).json({ error: '关键结果不存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE key_results SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      target_value = COALESCE(?, target_value),
      current_value = COALESCE(?, current_value),
      unit = COALESCE(?, unit),
      weight = COALESCE(?, weight),
      status = COALESCE(?, status),
      deadline = COALESCE(?, deadline),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(title, description, target_value, current_value, unit, weight, status, deadline, id);
  
  updateKRStatus(id);
  
  const goalId = db.prepare('SELECT goal_id FROM key_results WHERE id = ?').get(id).goal_id;
  updateGoalStatus(goalId);
  
  logOperation(req, 'update_kr', 'key_result', id, { title, current_value, status });
  
  res.json({ id, message: '关键结果更新成功' });
});

router.delete('/key-results/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const kr = db.prepare(`
    SELECT kr.id, kr.title, kr.goal_id FROM key_results kr
    JOIN goals g ON kr.goal_id = g.id
    WHERE kr.id = ? AND g.user_id = ?
  `).get(id, userId);
  
  if (!kr) {
    return res.status(404).json({ error: '关键结果不存在' });
  }
  
  db.prepare('DELETE FROM key_results WHERE id = ?').run(id);
  updateGoalStatus(kr.goal_id);
  
  logOperation(req, 'delete_kr', 'key_result', id, { title: kr.title, goalId: kr.goal_id });
  
  res.json({ message: '关键结果删除成功' });
});

module.exports = router;
