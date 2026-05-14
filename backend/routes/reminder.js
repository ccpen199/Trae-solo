const express = require('express');
const { db } = require('../database');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/my', authMiddleware, (req, res) => {
  try {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const reminders = db.prepare(`
      SELECT r.*,
        fs.product_name,
        fs.product_thumb,
        fs.original_price,
        fs.sale_price,
        fs.start_time,
        fs.end_time
      FROM reminders r
      LEFT JOIN flash_sales fs ON r.flash_sale_id = fs.id
      WHERE r.user_id = ? AND r.enabled = 1
      ORDER BY r.created_at DESC
    `).all(req.user.id);

    const flashSaleReminders = reminders.filter(r => r.flash_sale_id && fsIsUpcoming(r));
    const logisticsReminders = reminders.filter(r => r.type === 'logistics');

    return res.json(success({
      flash_sales: flashSaleReminders,
      logistics: logisticsReminders
    }));

    function fsIsUpcoming(r) {
      if (!r.start_time) return false;
      const startTime = new Date(r.start_time);
      return startTime <= weekLater;
    }
  } catch (err) {
    console.error('获取我的提醒失败:', err);
    return res.status(500).json(error('获取提醒失败'));
  }
});

router.get('/list', authMiddleware, (req, res) => {
  try {
    const reminders = db.prepare(`
      SELECT r.*,
        fs.product_name,
        fs.product_thumb,
        fs.start_time
      FROM reminders r
      LEFT JOIN flash_sales fs ON r.flash_sale_id = fs.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);

    return res.json(success(reminders));
  } catch (err) {
    console.error('获取提醒列表失败:', err);
    return res.status(500).json(error('获取提醒列表失败'));
  }
});

router.post('/create', authMiddleware, (req, res) => {
  try {
    const { flash_sale_id, type, keyword, ringtone, vibration, advance_time, repeat_type } = req.body;

    if (!type) {
      return res.status(400).json(error('提醒类型不能为空'));
    }

    const existingReminder = db.prepare(`
      SELECT id FROM reminders WHERE user_id = ? AND flash_sale_id = ?
    `).get(req.user.id, flash_sale_id || null);

    if (existingReminder) {
      return res.status(400).json(error('已设置过该商品提醒'));
    }

    const insertStmt = db.prepare(`
      INSERT INTO reminders (
        user_id, flash_sale_id, type, enabled, keyword, ringtone, vibration, advance_time, repeat_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      req.user.id,
      flash_sale_id || null,
      type,
      1,
      keyword || null,
      ringtone || 'default',
      vibration !== undefined ? (vibration ? 1 : 0) : 1,
      advance_time || 5,
      repeat_type || 'once'
    );

    if (flash_sale_id) {
      const flashSale = db.prepare('SELECT start_time FROM flash_sales WHERE id = ?').get(flash_sale_id);
      if (flashSale?.start_time) {
        const triggerTime = new Date(new Date(flashSale.start_time).getTime() - (advance_time || 5) * 60 * 1000);
        
        db.prepare(`
          INSERT INTO reminder_tasks (reminder_id, trigger_time, status)
          VALUES (?, ?, 'pending')
        `).run(result.lastInsertRowid, triggerTime.toISOString());
      }
    }

    const reminder = db.prepare(`
      SELECT r.*,
        fs.product_name,
        fs.product_thumb,
        fs.start_time
      FROM reminders r
      LEFT JOIN flash_sales fs ON r.flash_sale_id = fs.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    return res.json(success(reminder, '提醒设置成功'));
  } catch (err) {
    console.error('创建提醒失败:', err);
    return res.status(500).json(error('创建提醒失败'));
  }
});

router.put('/toggle/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?').get(id, req.user.id);
    
    if (!reminder) {
      return res.status(404).json(error('提醒不存在'));
    }

    db.prepare('UPDATE reminders SET enabled = ? WHERE id = ? AND user_id = ?')
      .run(enabled ? 1 : 0, id, req.user.id);

    const updatedReminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);

    return res.json(success(updatedReminder, enabled ? '提醒已开启' : '提醒已关闭'));
  } catch (err) {
    console.error('切换提醒状态失败:', err);
    return res.status(500).json(error('操作失败'));
  }
});

router.put('/update/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, ringtone, vibration, advance_time, repeat_type } = req.body;

    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?').get(id, req.user.id);
    
    if (!reminder) {
      return res.status(404).json(error('提醒不存在'));
    }

    db.prepare(`
      UPDATE reminders SET 
        keyword = COALESCE(?, keyword),
        ringtone = COALESCE(?, ringtone),
        vibration = COALESCE(?, vibration),
        advance_time = COALESCE(?, advance_time),
        repeat_type = COALESCE(?, repeat_type)
      WHERE id = ? AND user_id = ?
    `).run(
      keyword || null,
      ringtone || null,
      vibration !== undefined ? (vibration ? 1 : 0) : null,
      advance_time || null,
      repeat_type || null,
      id,
      req.user.id
    );

    if (reminder.flash_sale_id && advance_time !== undefined) {
      const flashSale = db.prepare('SELECT start_time FROM flash_sales WHERE id = ?').get(reminder.flash_sale_id);
      if (flashSale?.start_time) {
        const triggerTime = new Date(new Date(flashSale.start_time).getTime() - advance_time * 60 * 1000);
        db.prepare(`
          UPDATE reminder_tasks SET trigger_time = ? WHERE reminder_id = ? AND status = 'pending'
        `).run(triggerTime.toISOString(), id);
      }
    }

    const updatedReminder = db.prepare(`
      SELECT r.*,
        fs.product_name,
        fs.product_thumb,
        fs.start_time
      FROM reminders r
      LEFT JOIN flash_sales fs ON r.flash_sale_id = fs.id
      WHERE r.id = ?
    `).get(id);

    return res.json(success(updatedReminder, '提醒已更新'));
  } catch (err) {
    console.error('更新提醒失败:', err);
    return res.status(500).json(error('更新提醒失败'));
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_id = ?').get(id, req.user.id);
    
    if (!reminder) {
      return res.status(404).json(error('提醒不存在'));
    }

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM reminder_tasks WHERE reminder_id = ?').run(id);
      db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?').run(id, req.user.id);
    });
    transaction();

    return res.json(success(null, '提醒已删除'));
  } catch (err) {
    console.error('删除提醒失败:', err);
    return res.status(500).json(error('删除提醒失败'));
  }
});

router.get('/tasks', authMiddleware, (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT rt.*, r.keyword, r.ringtone, r.vibration,
        fs.product_name
      FROM reminder_tasks rt
      JOIN reminders r ON rt.reminder_id = r.id
      LEFT JOIN flash_sales fs ON r.flash_sale_id = fs.id
      WHERE r.user_id = ? AND rt.status = 'pending'
      ORDER BY rt.trigger_time ASC
    `).all(req.user.id);

    return res.json(success(tasks));
  } catch (err) {
    console.error('获取提醒任务失败:', err);
    return res.status(500).json(error('获取提醒任务失败'));
  }
});

module.exports = router;
