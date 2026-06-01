const db = require('../config/database');
const { success, error } = require('../utils/response');

const getHabits = (req, res) => {
  const userId = req.user.id;
  
  try {
    const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY sort_order ASC, created_at DESC').all(userId);
    res.json(success(habits));
  } catch (err) {
    console.error('获取习惯列表失败:', err);
    res.status(500).json(error('获取习惯列表失败'));
  }
};

const createHabit = (req, res) => {
  const userId = req.user.id;
  const { name, icon, color, reminder_time, target_days } = req.body;

  if (!name) {
    return res.status(400).json(error('习惯名称不能为空'));
  }

  try {
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM habits WHERE user_id = ?').get(userId);
    const sortOrder = (maxOrder?.max_order || 0) + 1;

    const result = db.prepare('INSERT INTO habits (user_id, name, icon, color, reminder_time, target_days, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)').run(userId, name, icon || '✅', color || '#4CAF50', reminder_time, target_days || 21, sortOrder);

    res.json(success({ id: result.lastInsertRowid, name, icon, color, reminder_time, target_days }, '习惯创建成功'));
  } catch (err) {
    console.error('创建习惯失败:', err);
    res.status(500).json(error('创建习惯失败'));
  }
};

const updateHabit = (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const { name, icon, color, reminder_time, target_days } = req.body;

  try {
    const result = db.prepare('UPDATE habits SET name = ?, icon = ?, color = ?, reminder_time = ?, target_days = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(name, icon, color, reminder_time, target_days, habitId, userId);
    
    if (result.changes === 0) {
      return res.status(404).json(error('习惯不存在'));
    }
    res.json(success(null, '习惯更新成功'));
  } catch (err) {
    console.error('更新习惯失败:', err);
    res.status(500).json(error('更新习惯失败'));
  }
};

const deleteHabit = (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;

  try {
    const result = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(habitId, userId);
    
    if (result.changes === 0) {
      return res.status(404).json(error('习惯不存在'));
    }
    res.json(success(null, '习惯删除成功'));
  } catch (err) {
    console.error('删除习惯失败:', err);
    res.status(500).json(error('删除习惯失败'));
  }
};

const checkInHabit = (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const { note } = req.body;
  const checkDate = new Date().toISOString().split('T')[0];

  try {
    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId);
    
    if (!habit) {
      return res.status(404).json(error('习惯不存在'));
    }

    db.prepare('INSERT INTO habit_records (habit_id, user_id, check_date, note) VALUES (?, ?, ?, ?)').run(habitId, userId, checkDate, note || '');

    db.prepare('UPDATE habits SET current_days = current_days + 1, total_days = total_days + 1 WHERE id = ?').run(habitId);

    res.json(success({ check_date: checkDate, current_days: habit.current_days + 1 }, '打卡成功'));
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json(error('今天已经打卡了'));
    }
    console.error('打卡失败:', err);
    res.status(500).json(error('打卡失败'));
  }
};

const getHabitRecords = (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;

  try {
    const records = db.prepare('SELECT * FROM habit_records WHERE habit_id = ? AND user_id = ? ORDER BY check_date DESC LIMIT 30').all(habitId, userId);
    res.json(success(records));
  } catch (err) {
    console.error('获取记录失败:', err);
    res.status(500).json(error('获取记录失败'));
  }
};

const updateSortOrder = (req, res) => {
  const userId = req.user.id;
  const { orders } = req.body;

  try {
    const updateStmt = db.prepare('UPDATE habits SET sort_order = ? WHERE id = ? AND user_id = ?');
    
    orders.forEach(({ id, sort_order }) => {
      updateStmt.run(sort_order, id, userId);
    });

    res.json(success(null, '排序更新成功'));
  } catch (err) {
    console.error('排序更新失败:', err);
    res.status(500).json(error('排序更新失败'));
  }
};

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, checkInHabit, getHabitRecords, updateSortOrder };