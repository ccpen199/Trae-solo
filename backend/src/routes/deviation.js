const express = require('express');
const db = require('../utils/db');
const { authenticateToken, logOperation } = require('../middleware/auth');
const { updateKRStatus, updateGoalStatus } = require('../utils/progress');

const router = express.Router();
router.use(authenticateToken);

const DEVIATION_TYPES = ['延期', '取消', '转向', '外部因素', '资源不足', '其他'];

router.get('/types', (req, res) => {
  res.json({ types: DEVIATION_TYPES });
});

router.get('/', (req, res) => {
  const { key_result_id, type } = req.query;
  const userId = req.user.id;
  
  let sql = `
    SELECT da.*, kr.title as kr_title, g.title as goal_title, g.dimension as goal_dimension
    FROM deviation_analyses da
    JOIN key_results kr ON da.key_result_id = kr.id
    JOIN goals g ON kr.goal_id = g.id
    WHERE g.user_id = ?
  `;
  const params = [userId];
  
  if (key_result_id) {
    sql += ' AND da.key_result_id = ?';
    params.push(key_result_id);
  }
  
  if (type) {
    sql += ' AND da.type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY da.created_at DESC';
  
  const deviations = db.prepare(sql).all(...params);
  
  res.json(deviations);
});

router.post('/', (req, res) => {
  const { key_result_id, type, reason, impact, solution } = req.body;
  const userId = req.user.id;
  
  const kr = db.prepare(`
    SELECT kr.id FROM key_results kr
    JOIN goals g ON kr.goal_id = g.id
    WHERE kr.id = ? AND g.user_id = ?
  `).get(key_result_id, userId);
  
  if (!kr) {
    return res.status(404).json({ error: '关键结果不存在' });
  }
  
  if (!type || !reason) {
    return res.status(400).json({ error: '偏差类型和原因不能为空' });
  }
  
  if (!DEVIATION_TYPES.includes(type)) {
    return res.status(400).json({ error: '无效的偏差类型' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO deviation_analyses (key_result_id, type, reason, impact, solution)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(key_result_id, type, reason, impact || '', solution || '');
  
  logOperation(req, 'create_deviation', 'deviation_analysis', result.lastInsertRowid, { key_result_id, type });
  
  res.json({ id: result.lastInsertRowid, message: '偏差分析记录创建成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { type, reason, impact, solution } = req.body;
  const userId = req.user.id;
  
  const deviation = db.prepare(`
    SELECT da.id, da.key_result_id FROM deviation_analyses da
    JOIN key_results kr ON da.key_result_id = kr.id
    JOIN goals g ON kr.goal_id = g.id
    WHERE da.id = ? AND g.user_id = ?
  `).get(id, userId);
  
  if (!deviation) {
    return res.status(404).json({ error: '偏差分析记录不存在' });
  }
  
  if (type && !DEVIATION_TYPES.includes(type)) {
    return res.status(400).json({ error: '无效的偏差类型' });
  }
  
  const stmt = db.prepare(`
    UPDATE deviation_analyses SET 
      type = COALESCE(?, type),
      reason = COALESCE(?, reason),
      impact = COALESCE(?, impact),
      solution = COALESCE(?, solution)
    WHERE id = ?
  `);
  
  stmt.run(type, reason, impact, solution, id);
  
  logOperation(req, 'update_deviation', 'deviation_analysis', id, { type });
  
  res.json({ id, message: '偏差分析记录更新成功' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const deviation = db.prepare(`
    SELECT da.id, da.type, da.key_result_id FROM deviation_analyses da
    JOIN key_results kr ON da.key_result_id = kr.id
    JOIN goals g ON kr.goal_id = g.id
    WHERE da.id = ? AND g.user_id = ?
  `).get(id, userId);
  
  if (!deviation) {
    return res.status(404).json({ error: '偏差分析记录不存在' });
  }
  
  db.prepare('DELETE FROM deviation_analyses WHERE id = ?').run(id);
  
  logOperation(req, 'delete_deviation', 'deviation_analysis', id, { type: deviation.type });
  
  res.json({ message: '偏差分析记录删除成功' });
});

router.get('/annual-review/:year', (req, res) => {
  const { year } = req.params;
  const userId = req.user.id;
  
  let review = db.prepare(`
    SELECT * FROM annual_reviews 
    WHERE user_id = ? AND year = ?
  `).get(userId, year);
  
  const goals = db.prepare(`
    SELECT g.*, 
           (SELECT COUNT(*) FROM key_results kr WHERE kr.goal_id = g.id) as kr_count,
           (SELECT COUNT(*) FROM key_results kr WHERE kr.goal_id = g.id AND kr.status = 'completed') as kr_completed
    FROM goals g 
    WHERE g.user_id = ? AND g.year = ?
    ORDER BY g.weight DESC
  `).all(userId, year);
  
  const goalsWithProgress = goals.map(goal => {
    const krs = db.prepare('SELECT * FROM key_results WHERE goal_id = ?').all(goal.id).map(kr => ({
      ...kr,
      deviations: db.prepare('SELECT * FROM deviation_analyses WHERE key_result_id = ?').all(kr.id)
    }));
    
    const progress = krs.length > 0 
      ? Math.round((krs.filter(kr => kr.status === 'completed').length / krs.length) * 100)
      : 0;
    
    return { ...goal, progress, key_results: krs };
  });
  
  const deviations = db.prepare(`
    SELECT da.*, kr.title as kr_title, g.title as goal_title, g.dimension
    FROM deviation_analyses da
    JOIN key_results kr ON da.key_result_id = kr.id
    JOIN goals g ON kr.goal_id = g.id
    WHERE g.user_id = ? AND g.year = ?
    ORDER BY da.created_at DESC
  `).all(userId, year);
  
  const executionStats = db.prepare(`
    SELECT 
      COUNT(*) as total_records,
      SUM(time_spent) as total_time,
      DATE(record_date, '%Y-%m') as month
    FROM execution_records er
    JOIN key_results kr ON er.key_result_id = kr.id
    JOIN goals g ON kr.goal_id = g.id
    WHERE g.user_id = ? AND g.year = ?
    GROUP BY DATE(record_date, '%Y-%m')
    ORDER BY month
  `).all(userId, year);
  
  const habitStats = db.prepare(`
    SELECT 
      h.name,
      COUNT(hc.id) as checkin_count,
      h.frequency
    FROM habits h
    LEFT JOIN habit_checkins hc ON h.id = hc.habit_id
    WHERE h.user_id = ? AND strftime('%Y', hc.checkin_date) = ?
    GROUP BY h.id
  `).all(userId, year);
  
  res.json({
    review,
    goals: goalsWithProgress,
    deviations,
    executionStats,
    habitStats,
    summary: {
      total_goals: goals.length,
      completed_goals: goalsWithProgress.filter(g => g.progress >= 100).length,
      total_krs: goals.reduce((sum, g) => sum + g.kr_count, 0),
      completed_krs: goals.reduce((sum, g) => sum + g.kr_completed, 0),
      total_deviations: deviations.length,
      total_time: executionStats.reduce((sum, s) => sum + (s.total_time || 0), 0),
      total_checkins: habitStats.reduce((sum, h) => sum + h.checkin_count, 0)
    }
  });
});

router.post('/annual-review', (req, res) => {
  const { year, summary, achievements, key_events, harvest, regrets, lessons, next_year_suggestions, is_completed } = req.body;
  const userId = req.user.id;
  
  if (!year) {
    return res.status(400).json({ error: '年份不能为空' });
  }
  
  const existing = db.prepare('SELECT id FROM annual_reviews WHERE user_id = ? AND year = ?').get(userId, year);
  
  let result;
  if (existing) {
    const stmt = db.prepare(`
      UPDATE annual_reviews SET 
        summary = COALESCE(?, summary),
        achievements = COALESCE(?, achievements),
        key_events = COALESCE(?, key_events),
        harvest = COALESCE(?, harvest),
        regrets = COALESCE(?, regrets),
        lessons = COALESCE(?, lessons),
        next_year_suggestions = COALESCE(?, next_year_suggestions),
        is_completed = COALESCE(?, is_completed),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND year = ?
    `);
    stmt.run(summary, achievements, key_events, harvest, regrets, lessons, next_year_suggestions, is_completed ? 1 : 0, userId, year);
    result = { id: existing.id };
  } else {
    const stmt = db.prepare(`
      INSERT INTO annual_reviews (user_id, year, summary, achievements, key_events, harvest, regrets, lessons, next_year_suggestions, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    result = stmt.run(userId, year, summary || '', achievements || '', key_events || '', harvest || '', regrets || '', lessons || '', next_year_suggestions || '', is_completed ? 1 : 0);
    result = { id: result.lastInsertRowid };
  }
  
  logOperation(req, 'save_annual_review', 'annual_review', result.id, { year, is_completed });
  
  res.json({ ...result, message: '年度复盘保存成功' });
});

module.exports = router;
