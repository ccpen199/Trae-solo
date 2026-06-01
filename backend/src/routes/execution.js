const express = require('express');
const db = require('../utils/db');
const { authenticateToken, logOperation } = require('../middleware/auth');
const { updateKRStatus, updateGoalStatus, calculateKRProgress } = require('../utils/progress');
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek);

const router = express.Router();
router.use(authenticateToken);

router.get('/weekly-plans', (req, res) => {
  const { year, week_number } = req.query;
  const userId = req.user.id;
  
  let sql = 'SELECT * FROM weekly_plans WHERE user_id = ?';
  const params = [userId];
  
  if (year) {
    sql += ' AND year = ?';
    params.push(year);
  }
  
  if (week_number) {
    sql += ' AND week_number = ?';
    params.push(week_number);
  }
  
  sql += ' ORDER BY year DESC, week_number DESC';
  
  const plans = db.prepare(sql).all(...params);
  
  const plansWithTasks = plans.map(plan => ({
    ...plan,
    tasks: db.prepare(`
      SELECT wt.*, kr.title as kr_title, g.dimension as goal_dimension
      FROM weekly_tasks wt
      LEFT JOIN key_results kr ON wt.key_result_id = kr.id
      LEFT JOIN goals g ON kr.goal_id = g.id
      WHERE wt.weekly_plan_id = ?
      ORDER BY wt.priority ASC, wt.created_at DESC
    `).all(plan.id)
  }));
  
  res.json(plansWithTasks);
});

router.get('/weekly-plans/current', (req, res) => {
  const userId = req.user.id;
  const now = dayjs();
  const year = now.year();
  const weekNumber = now.isoWeek();
  
  let plan = db.prepare(`
    SELECT * FROM weekly_plans 
    WHERE user_id = ? AND year = ? AND week_number = ?
  `).get(userId, year, weekNumber);
  
  if (!plan) {
    const startOfWeek = now.startOf('isoWeek').format('YYYY-MM-DD');
    const endOfWeek = now.endOf('isoWeek').format('YYYY-MM-DD');
    
    const stmt = db.prepare(`
      INSERT INTO weekly_plans (user_id, year, week_number, start_date, end_date, focus)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(userId, year, weekNumber, startOfWeek, endOfWeek, '本周重点工作');
    plan = db.prepare('SELECT * FROM weekly_plans WHERE id = ?').get(result.lastInsertRowid);
  }
  
  const tasks = db.prepare(`
    SELECT wt.*, kr.title as kr_title, g.dimension as goal_dimension
    FROM weekly_tasks wt
    LEFT JOIN key_results kr ON wt.key_result_id = kr.id
    LEFT JOIN goals g ON kr.goal_id = g.id
    WHERE wt.weekly_plan_id = ?
    ORDER BY wt.priority ASC, wt.created_at DESC
  `).all(plan.id);
  
  res.json({ ...plan, tasks });
});

router.post('/weekly-plans', (req, res) => {
  const { year, week_number, start_date, end_date, focus } = req.body;
  const userId = req.user.id;
  
  if (!year || !week_number || !start_date || !end_date) {
    return res.status(400).json({ error: '年份、周数、起止日期不能为空' });
  }
  
  const existing = db.prepare(`
    SELECT id FROM weekly_plans WHERE user_id = ? AND year = ? AND week_number = ?
  `).get(userId, year, week_number);
  
  if (existing) {
    return res.status(400).json({ error: '该周计划已存在' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO weekly_plans (user_id, year, week_number, start_date, end_date, focus)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(userId, year, week_number, start_date, end_date, focus || '');
  
  logOperation(req, 'create_weekly_plan', 'weekly_plan', result.lastInsertRowid, { year, week_number });
  
  res.json({ id: result.lastInsertRowid, message: '周计划创建成功' });
});

router.post('/weekly-plans/:planId/tasks', (req, res) => {
  const { planId } = req.params;
  const { key_result_id, title, description, priority, status } = req.body;
  const userId = req.user.id;
  
  const plan = db.prepare('SELECT id FROM weekly_plans WHERE id = ? AND user_id = ?').get(planId, userId);
  
  if (!plan) {
    return res.status(404).json({ error: '周计划不存在' });
  }
  
  if (!title) {
    return res.status(400).json({ error: '任务标题不能为空' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO weekly_tasks (weekly_plan_id, key_result_id, title, description, priority, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(planId, key_result_id || null, title, description || '', priority || 3, status || 'pending');
  
  logOperation(req, 'create_weekly_task', 'weekly_task', result.lastInsertRowid, { planId, title });
  
  res.json({ id: result.lastInsertRowid, message: '周任务创建成功' });
});

router.put('/weekly-tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  const { title, description, priority, status, actual_progress, completed_at } = req.body;
  const userId = req.user.id;
  
  const task = db.prepare(`
    SELECT wt.id, wt.key_result_id, wt.status FROM weekly_tasks wt
    JOIN weekly_plans wp ON wt.weekly_plan_id = wp.id
    WHERE wt.id = ? AND wp.user_id = ?
  `).get(taskId, userId);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE weekly_tasks SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      status = COALESCE(?, status),
      actual_progress = COALESCE(?, actual_progress),
      completed_at = COALESCE(?, completed_at),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(title, description, priority, status, actual_progress, completed_at, taskId);
  
  if (task.key_result_id && (status === 'completed' || task.status !== status)) {
    updateKRStatus(task.key_result_id);
    const goalId = db.prepare('SELECT goal_id FROM key_results WHERE id = ?').get(task.key_result_id).goal_id;
    updateGoalStatus(goalId);
  }
  
  logOperation(req, 'update_weekly_task', 'weekly_task', taskId, { title, status });
  
  res.json({ id: taskId, message: '任务更新成功' });
});

router.delete('/weekly-tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;
  
  const task = db.prepare(`
    SELECT wt.id, wt.title, wt.key_result_id FROM weekly_tasks wt
    JOIN weekly_plans wp ON wt.weekly_plan_id = wp.id
    WHERE wt.id = ? AND wp.user_id = ?
  `).get(taskId, userId);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  db.prepare('DELETE FROM weekly_tasks WHERE id = ?').run(taskId);
  
  if (task.key_result_id) {
    updateKRStatus(task.key_result_id);
    const goalId = db.prepare('SELECT goal_id FROM key_results WHERE id = ?').get(task.key_result_id).goal_id;
    updateGoalStatus(goalId);
  }
  
  logOperation(req, 'delete_weekly_task', 'weekly_task', taskId, { title: task.title });
  
  res.json({ message: '任务删除成功' });
});

router.post('/milestones', (req, res) => {
  const { key_result_id, title, description, target_date, target_value } = req.body;
  const userId = req.user.id;
  
  const kr = db.prepare(`
    SELECT kr.id FROM key_results kr
    JOIN goals g ON kr.goal_id = g.id
    WHERE kr.id = ? AND g.user_id = ?
  `).get(key_result_id, userId);
  
  if (!kr) {
    return res.status(404).json({ error: '关键结果不存在' });
  }
  
  if (!title) {
    return res.status(400).json({ error: '里程碑标题不能为空' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO milestones (key_result_id, title, description, target_date, target_value)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(key_result_id, title, description || '', target_date || null, target_value || null);
  
  logOperation(req, 'create_milestone', 'milestone', result.lastInsertRowid, { key_result_id, title });
  
  updateKRStatus(key_result_id);
  const goalId = db.prepare('SELECT goal_id FROM key_results WHERE id = ?').get(key_result_id).goal_id;
  updateGoalStatus(goalId);
  
  res.json({ id: result.lastInsertRowid, message: '里程碑创建成功' });
});

router.put('/milestones/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, target_date, target_value, is_completed, completed_at, evidence } = req.body;
  const userId = req.user.id;
  
  const milestone = db.prepare(`
    SELECT m.id, m.key_result_id FROM milestones m
    JOIN key_results kr ON m.key_result_id = kr.id
    JOIN goals g ON kr.goal_id = g.id
    WHERE m.id = ? AND g.user_id = ?
  `).get(id, userId);
  
  if (!milestone) {
    return res.status(404).json({ error: '里程碑不存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE milestones SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      target_date = COALESCE(?, target_date),
      target_value = COALESCE(?, target_value),
      is_completed = COALESCE(?, is_completed),
      completed_at = COALESCE(?, completed_at),
      evidence = COALESCE(?, evidence),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(title, description, target_date, target_value, is_completed, completed_at, evidence, id);
  
  updateKRStatus(milestone.key_result_id);
  const goalId = db.prepare('SELECT goal_id FROM key_results WHERE id = ?').get(milestone.key_result_id).goal_id;
  updateGoalStatus(goalId);
  
  logOperation(req, 'update_milestone', 'milestone', id, { title, is_completed });
  
  res.json({ id, message: '里程碑更新成功' });
});

router.delete('/milestones/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const milestone = db.prepare(`
    SELECT m.id, m.title, m.key_result_id FROM milestones m
    JOIN key_results kr ON m.key_result_id = kr.id
    JOIN goals g ON kr.goal_id = g.id
    WHERE m.id = ? AND g.user_id = ?
  `).get(id, userId);
  
  if (!milestone) {
    return res.status(404).json({ error: '里程碑不存在' });
  }
  
  db.prepare('DELETE FROM milestones WHERE id = ?').run(id);
  
  updateKRStatus(milestone.key_result_id);
  const goalId = db.prepare('SELECT goal_id FROM key_results WHERE id = ?').get(milestone.key_result_id).goal_id;
  updateGoalStatus(goalId);
  
  logOperation(req, 'delete_milestone', 'milestone', id, { title: milestone.title });
  
  res.json({ message: '里程碑删除成功' });
});

router.post('/execution-records', (req, res) => {
  const { key_result_id, record_date, progress_value, description, time_spent } = req.body;
  const userId = req.user.id;
  
  const kr = db.prepare(`
    SELECT kr.id, kr.current_value, kr.target_value FROM key_results kr
    JOIN goals g ON kr.goal_id = g.id
    WHERE kr.id = ? AND g.user_id = ?
  `).get(key_result_id, userId);
  
  if (!kr) {
    return res.status(404).json({ error: '关键结果不存在' });
  }
  
  if (!description) {
    return res.status(400).json({ error: '执行记录描述不能为空' });
  }
  
  const tx = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO execution_records (key_result_id, record_date, progress_value, description, time_spent)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(key_result_id, record_date || dayjs().format('YYYY-MM-DD'), progress_value || 0, description, time_spent || 0);
    
    if (progress_value !== undefined && progress_value !== null) {
      const newValue = Math.min(kr.target_value || Infinity, (kr.current_value || 0) + progress_value);
      db.prepare('UPDATE key_results SET current_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newValue, key_result_id);
    }
    
    return result.lastInsertRowid;
  });
  
  const recordId = tx();
  
  updateKRStatus(key_result_id);
  const goalId = db.prepare('SELECT goal_id FROM key_results WHERE id = ?').get(key_result_id).goal_id;
  updateGoalStatus(goalId);
  
  logOperation(req, 'create_execution_record', 'execution_record', recordId, { key_result_id, progress_value });
  
  res.json({ id: recordId, message: '执行记录创建成功' });
});

router.get('/habits', (req, res) => {
  const userId = req.user.id;
  
  const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC').all(userId);
  
  const habitsWithStats = habits.map(habit => {
    const checkins = db.prepare(`
      SELECT * FROM habit_checkins 
      WHERE habit_id = ? 
      ORDER BY checkin_date DESC 
      LIMIT 30
    `).all(habit.id);
    
    const thisMonth = dayjs().startOf('month');
    const monthCheckins = checkins.filter(c => dayjs(c.checkin_date).isAfter(thisMonth));
    
    return {
      ...habit,
      recent_checkins: checkins,
      month_count: monthCheckins.length,
      streak: calculateStreak(checkins)
    };
  });
  
  res.json(habitsWithStats);
});

function calculateStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0;
  
  let streak = 0;
  const today = dayjs().startOf('day');
  
  for (let i = 0; i < 365; i++) {
    const checkDate = today.subtract(i, 'day').format('YYYY-MM-DD');
    const hasCheckin = checkins.some(c => c.checkin_date === checkDate);
    
    if (hasCheckin) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
}

router.post('/habits', (req, res) => {
  const { key_result_id, name, description, frequency, target_count, unit } = req.body;
  const userId = req.user.id;
  
  if (!name) {
    return res.status(400).json({ error: '习惯名称不能为空' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO habits (user_id, key_result_id, name, description, frequency, target_count, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(userId, key_result_id || null, name, description || '', frequency || 'daily', target_count || 1, unit || '次');
  
  logOperation(req, 'create_habit', 'habit', result.lastInsertRowid, { name, frequency });
  
  res.json({ id: result.lastInsertRowid, message: '习惯创建成功' });
});

router.post('/habits/:habitId/checkin', (req, res) => {
  const { habitId } = req.params;
  const { checkin_date, count, note } = req.body;
  const userId = req.user.id;
  
  const habit = db.prepare('SELECT id, key_result_id FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
  
  if (!habit) {
    return res.status(404).json({ error: '习惯不存在' });
  }
  
  const date = checkin_date || dayjs().format('YYYY-MM-DD');
  
  const existing = db.prepare('SELECT id FROM habit_checkins WHERE habit_id = ? AND checkin_date = ?').get(habitId, date);
  
  if (existing) {
    return res.status(400).json({ error: '今日已打卡' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO habit_checkins (habit_id, checkin_date, count, note)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(habitId, date, count || 1, note || '');
  
  if (habit.key_result_id) {
    updateKRStatus(habit.key_result_id);
    const goalId = db.prepare('SELECT goal_id FROM key_results WHERE id = ?').get(habit.key_result_id).goal_id;
    updateGoalStatus(goalId);
  }
  
  logOperation(req, 'habit_checkin', 'habit_checkin', result.lastInsertRowid, { habitId, date });
  
  res.json({ id: result.lastInsertRowid, message: '打卡成功' });
});

router.delete('/habits/:habitId', (req, res) => {
  const { habitId } = req.params;
  const userId = req.user.id;
  
  const habit = db.prepare('SELECT id, name, key_result_id FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
  
  if (!habit) {
    return res.status(404).json({ error: '习惯不存在' });
  }
  
  db.prepare('UPDATE habits SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(habitId);
  
  if (habit.key_result_id) {
    updateKRStatus(habit.key_result_id);
    const goalId = db.prepare('SELECT goal_id FROM key_results WHERE id = ?').get(habit.key_result_id).goal_id;
    updateGoalStatus(goalId);
  }
  
  logOperation(req, 'delete_habit', 'habit', habitId, { name: habit.name });
  
  res.json({ message: '习惯已删除' });
});

module.exports = router;
