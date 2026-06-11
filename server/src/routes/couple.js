const express = require('express');
const db = require('../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

const DEFAULT_TASKS = [
  { title: '确定婚期', category: 'booking', days_before_wedding: 365, priority: 1 },
  { title: '预订婚宴酒店', category: 'booking', days_before_wedding: 300, priority: 1 },
  { title: '挑选婚纱摄影机构', category: 'photography', days_before_wedding: 270, priority: 1 },
  { title: '确定婚庆公司', category: 'wedding', days_before_wedding: 180, priority: 1 },
  { title: '选购婚纱礼服', category: 'dress', days_before_wedding: 150, priority: 2 },
  { title: '拍摄婚纱照', category: 'photography', days_before_wedding: 120, priority: 1 },
  { title: '确定伴郎伴娘', category: 'other', days_before_wedding: 90, priority: 2 },
  { title: '预订蜜月旅行', category: 'other', days_before_wedding: 90, priority: 2 },
  { title: '发送电子请柬', category: 'invitation', days_before_wedding: 60, priority: 2 },
  { title: '试妆试菜', category: 'wedding', days_before_wedding: 30, priority: 1 },
  { title: '确认婚礼流程', category: 'wedding', days_before_wedding: 15, priority: 1 },
  { title: '购买婚礼保险', category: 'other', days_before_wedding: 15, priority: 3 },
  { title: '婚前检查', category: 'other', days_before_wedding: 7, priority: 2 },
  { title: '物品准备到位', category: 'other', days_before_wedding: 7, priority: 2 },
  { title: '仪式彩排', category: 'wedding', days_before_wedding: 3, priority: 1 },
  { title: '婚礼当天', category: 'wedding', days_before_wedding: 0, priority: 1 }
];

const BUDGET_CATEGORIES = [
  { category: 'venue', name: '婚宴酒店', percentage: 0.35 },
  { category: 'photography', name: '婚纱摄影', percentage: 0.15 },
  { category: 'dress', name: '婚纱礼服', percentage: 0.10 },
  { category: 'jewelry', name: '珠宝首饰', percentage: 0.15 },
  { category: 'wedding', name: '婚庆策划', percentage: 0.10 },
  { category: 'other', name: '其他费用', percentage: 0.15 }
];

router.get('/profile', auth(['couple', 'admin']), (req, res) => {
  const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
  
  const profile = db.prepare(`
    SELECT cp.*, u.real_name, u.phone, u.city
    FROM couple_profiles cp
    LEFT JOIN users u ON cp.user_id = u.id
    WHERE cp.user_id = ?
  `).get(userId);
  
  if (!profile) {
    return res.status(404).json({ error: '新人档案不存在' });
  }
  
  if (profile.wedding_date) {
    const today = new Date();
    const weddingDate = new Date(profile.wedding_date);
    const daysLeft = Math.ceil((weddingDate - today) / (1000 * 60 * 60 * 24));
    profile.days_left = daysLeft;
  }
  
  res.json(profile);
});

router.put('/profile', auth(['couple']), (req, res) => {
  const { wedding_date, budget, city, guest_count, style_preference } = req.body;
  
  let profile = db.prepare('SELECT * FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  
  if (!profile) {
    const result = db.prepare(`
      INSERT INTO couple_profiles (user_id, wedding_date, budget, city, guest_count, style_preference)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, wedding_date, budget, city, guest_count, style_preference);
    
    if (wedding_date) {
      generateDefaultTasks(result.lastInsertRowid, wedding_date);
    }
    if (budget) {
      generateDefaultBudget(result.lastInsertRowid, budget);
    }
    
    res.status(201).json({ message: '创建成功' });
  } else {
    db.prepare(`
      UPDATE couple_profiles 
      SET wedding_date = ?, budget = ?, city = ?, guest_count = ?, style_preference = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(wedding_date, budget, city, guest_count, style_preference, req.user.id);
    
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM wedding_tasks WHERE couple_id = ?').get(profile.id).count;
    if (wedding_date && taskCount === 0) {
      generateDefaultTasks(profile.id, wedding_date);
    }
    
    const budgetCount = db.prepare('SELECT COUNT(*) as count FROM budget_items WHERE couple_id = ?').get(profile.id).count;
    if (budget && budgetCount === 0) {
      generateDefaultBudget(profile.id, budget);
    }
    
    res.json({ message: '更新成功' });
  }
});

function generateDefaultTasks(coupleId, weddingDate) {
  const wedding = new Date(weddingDate);
  const insert = db.prepare('INSERT INTO wedding_tasks (couple_id, title, description, category, due_date, priority, days_before_wedding) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  DEFAULT_TASKS.forEach(task => {
    const dueDate = new Date(wedding);
    dueDate.setDate(dueDate.getDate() - task.days_before_wedding);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    insert.run(coupleId, task.title, '', task.category, dueDateStr, task.priority, task.days_before_wedding);
  });
}

function generateDefaultBudget(coupleId, totalBudget) {
  const insert = db.prepare('INSERT INTO budget_items (couple_id, category, name, planned_amount) VALUES (?, ?, ?, ?)');
  
  BUDGET_CATEGORIES.forEach(item => {
    insert.run(coupleId, item.category, item.name, Math.round(totalBudget * item.percentage));
  });
}

router.get('/tasks', auth(['couple']), (req, res) => {
  const profile = db.prepare('SELECT * FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: '请先设置婚礼信息' });
  }
  
  const { status, category } = req.query;
  
  let where = 'WHERE couple_id = ?';
  const params = [profile.id];
  
  if (status !== undefined) {
    where += ' AND status = ?';
    params.push(parseInt(status));
  }
  
  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }
  
  const tasks = db.prepare(`
    SELECT * FROM wedding_tasks
    ${where}
    ORDER BY COALESCE(days_before_wedding, 99999) ASC, priority ASC
  `).all(...params);
  
  res.json(tasks);
});

router.post('/tasks', auth(['couple']), (req, res) => {
  const profile = db.prepare('SELECT * FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: '请先设置婚礼信息' });
  }
  
  const { title, description, category, due_date, priority } = req.body;
  
  const result = db.prepare(`
    INSERT INTO wedding_tasks (couple_id, title, description, category, due_date, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(profile.id, title, description || '', category || 'other', due_date, priority || 2);
  
  res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/tasks/:id', auth(['couple']), (req, res) => {
  const profile = db.prepare('SELECT * FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  const task = db.prepare('SELECT * FROM wedding_tasks WHERE id = ? AND couple_id = ?').get(req.params.id, profile?.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在或无权限修改' });
  }
  
  const { title, description, category, due_date, priority, status } = req.body;
  
  db.prepare(`
    UPDATE wedding_tasks 
    SET title = ?, description = ?, category = ?, due_date = ?, priority = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title || task.title, description, category || task.category,
    due_date, priority ?? task.priority, status ?? task.status,
    req.params.id
  );
  
  res.json({ message: '更新成功' });
});

router.delete('/tasks/:id', auth(['couple']), (req, res) => {
  const profile = db.prepare('SELECT * FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  const task = db.prepare('SELECT * FROM wedding_tasks WHERE id = ? AND couple_id = ?').get(req.params.id, profile?.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在或无权限删除' });
  }
  
  db.prepare('DELETE FROM wedding_tasks WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/budget', auth(['couple']), (req, res) => {
  const profile = db.prepare('SELECT * FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: '请先设置婚礼信息' });
  }
  
  const items = db.prepare(`
    SELECT * FROM budget_items WHERE couple_id = ?
    ORDER BY id ASC
  `).all(profile.id);
  
  const totalPlanned = items.reduce((sum, item) => sum + item.planned_amount, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actual_amount, 0);
  
  res.json({
    total_budget: profile.budget,
    total_planned: totalPlanned,
    total_actual: totalActual,
    remaining: totalPlanned - totalActual,
    items
  });
});

router.post('/budget/items', auth(['couple']), (req, res) => {
  const profile = db.prepare('SELECT * FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: '请先设置婚礼信息' });
  }
  
  const { category, name, planned_amount, actual_amount } = req.body;
  
  const result = db.prepare(`
    INSERT INTO budget_items (couple_id, category, name, planned_amount, actual_amount)
    VALUES (?, ?, ?, ?, ?)
  `).run(profile.id, category || 'other', name, planned_amount || 0, actual_amount || 0);
  
  res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/budget/items/:id', auth(['couple']), (req, res) => {
  const profile = db.prepare('SELECT * FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  const item = db.prepare('SELECT * FROM budget_items WHERE id = ? AND couple_id = ?').get(req.params.id, profile?.id);
  
  if (!item) {
    return res.status(404).json({ error: '预算项不存在或无权限修改' });
  }
  
  const { category, name, planned_amount, actual_amount, status } = req.body;
  
  db.prepare(`
    UPDATE budget_items 
    SET category = ?, name = ?, planned_amount = ?, actual_amount = ?, status = ?
    WHERE id = ?
  `).run(
    category || item.category, name || item.name,
    planned_amount ?? item.planned_amount, actual_amount ?? item.actual_amount,
    status ?? item.status,
    req.params.id
  );
  
  res.json({ message: '更新成功' });
});

router.delete('/budget/items/:id', auth(['couple']), (req, res) => {
  const profile = db.prepare('SELECT * FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  const item = db.prepare('SELECT * FROM budget_items WHERE id = ? AND couple_id = ?').get(req.params.id, profile?.id);
  
  if (!item) {
    return res.status(404).json({ error: '预算项不存在或无权限删除' });
  }
  
  db.prepare('DELETE FROM budget_items WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/countdown', auth(['couple']), (req, res) => {
  const profile = db.prepare('SELECT wedding_date, budget, city FROM couple_profiles WHERE user_id = ?').get(req.user.id);
  
  if (!profile || !profile.wedding_date) {
    return res.status(404).json({ error: '请先设置婚期' });
  }
  
  const today = new Date();
  const weddingDate = new Date(profile.wedding_date);
  const diffTime = weddingDate - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM wedding_tasks WHERE couple_id = ?').get(profile.id).count;
  const completedTasks = db.prepare('SELECT COUNT(*) as count FROM wedding_tasks WHERE couple_id = ? AND status = 1').get(profile.id).count;
  
  res.json({
    wedding_date: profile.wedding_date,
    days_left: daysLeft > 0 ? daysLeft : 0,
    is_passed: daysLeft <= 0,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    budget: profile.budget,
    city: profile.city
  });
});

module.exports = router;
