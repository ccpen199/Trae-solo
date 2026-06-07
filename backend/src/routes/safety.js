const express = require('express');
const { db } = require('../utils/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/knowledge', authenticateToken, (req, res) => {
  try {
    const { category } = req.query;

    let whereClause = "WHERE status = 'published'";
    const params = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    const list = db.prepare(`
      SELECT id, title, category, content, ar_asset_path, step_by_step, video_url, sort_order 
      FROM safety_knowledge 
      ${whereClause} 
      ORDER BY sort_order ASC, id ASC`).all(...params);

    res.json({
      list: list.map(item => ({
        ...item,
        step_by_step: item.step_by_step ? JSON.parse(item.step_by_step) : null
      }))
    });
  } catch (err) {
    res.status(500).json({ error: '获取安全知识失败' });
  }
});

router.get('/knowledge/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare("SELECT * FROM safety_knowledge WHERE id = ? AND status = 'published'").get(id);
    
    if (!item) {
      return res.status(404).json({ error: '内容不存在' });
    }

    res.json({
      ...item,
      step_by_step: item.step_by_step ? JSON.parse(item.step_by_step) : null
    });
  } catch (err) {
    res.status(500).json({ error: '获取详情失败' });
  }
});

router.get('/anomalies/my-anomalies', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const anomalies = db.prepare(`
      SELECT * FROM usage_anomalies 
      ${whereClause} 
      ORDER BY detected_date DESC, id DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM usage_anomalies ${whereClause}`).get(...params).count;

    res.json({
      list: anomalies.map(a => ({
        ...a,
        historical_data: a.historical_data ? JSON.parse(a.historical_data) : null
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    res.status(500).json({ error: '获取异常记录失败' });
  }
});

router.post('/anomalies/:id/confirm', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { is_real } = req.body;

    const anomaly = db.prepare('SELECT * FROM usage_anomalies WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!anomaly) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const newStatus = is_real ? 'confirmed' : 'false_alarm';
    db.prepare('UPDATE usage_anomalies SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);

    res.json({ message: '已确认' });
  } catch (err) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.get('/grid/my-tasks', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'grid_worker' && req.user.role !== 'admin') {
      return res.status(403).json({ error: '仅网格员可访问' });
    }

    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE gc.grid_worker_id = ?';
    const params = [req.user.id];

    if (status) {
      whereClause += ' AND gc.status = ?';
      params.push(status);
    }

    const tasks = db.prepare(`
      SELECT gc.*, u.real_name as user_name, u.phone as user_phone, u.address as user_address 
      FROM grid_collaborations gc 
      LEFT JOIN users u ON gc.user_id = u.id 
      ${whereClause} 
      ORDER BY gc.created_at DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM grid_collaborations gc ${whereClause}`).get(...params).count;

    res.json({
      list: tasks.map(t => ({
        ...t,
        images: t.images ? JSON.parse(t.images) : []
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    res.status(500).json({ error: '获取任务失败' });
  }
});

router.get('/usage/statistics', authenticateToken, (req, res) => {
  try {
    const { months = 12 } = req.query;

    const usageData = db.prepare(`
      SELECT billing_cycle, gas_usage, total_amount 
      FROM bills 
      WHERE user_id = ? AND status = 'paid' 
      ORDER BY billing_cycle DESC 
      LIMIT ?`).all(req.user.id, parseInt(months));

    const usageList = usageData.reverse();
    
    const avgUsage = usageList.length > 0 
      ? usageList.reduce((sum, b) => sum + b.gas_usage, 0) / usageList.length 
      : 0;

    let anomalies = [];
    if (usageList.length >= 6) {
      const recent = usageList.slice(-6);
      const avg6 = recent.reduce((s, b) => s + b.gas_usage, 0) / 6;
      
      usageList.forEach((b, i) => {
        const deviation = ((b.gas_usage - avg6) / avg6) * 100;
        if (Math.abs(deviation) > 50) {
          anomalies.push({
            cycle: b.billing_cycle,
            usage: b.gas_usage,
            expected: avg6.toFixed(2),
            deviation: deviation.toFixed(2),
            type: deviation > 0 ? 'sudden_increase' : 'sudden_decrease'
          });
        }
      });
    }

    res.json({
      usage_data: usageList,
      average_usage: parseFloat(avgUsage.toFixed(2)),
      detected_anomalies: anomalies,
      suggestion: anomalies.length > 0 
        ? '检测到用量异常，请检查家中燃气设施或联系客服' 
        : '用气情况正常，继续保持良好的用气习惯'
    });
  } catch (err) {
    console.error('统计错误:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/notifications', authenticateToken, (req, res) => {
  try {
    const { unread_only, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = ? OR user_id IS NULL';
    const params = [req.user.id];

    if (unread_only === '1' || unread_only === 'true') {
      whereClause += ' AND read = 0';
    }

    const notifications = db.prepare(`
      SELECT * FROM notification_logs 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM notification_logs ${whereClause}`).get(...params).count;
    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notification_logs WHERE (user_id = ? OR user_id IS NULL) AND read = 0').get(req.user.id).count;

    res.json({ list: notifications, total, unread_count: unreadCount, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: '获取通知失败' });
  }
});

router.put('/notifications/:id/read', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notification_logs SET read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)').run(id, req.user.id);
    res.json({ message: '已标记已读' });
  } catch (err) {
    res.status(500).json({ error: '操作失败' });
  }
});

module.exports = router;
