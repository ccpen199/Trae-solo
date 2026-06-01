const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { maskContent, validateRuleVersion } = require('../services/maskService');
const { createAuditLog, createAlert } = require('../services/auditService');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, appId, operationType, requestedBy, startDate, endDate } = req.query;
    let sql = `
      SELECT t.*, a.name as app_name, 
             req.name as requested_by_name,
             app.name as approved_by_name,
             exe.name as executed_by_name
      FROM tasks t
      LEFT JOIN applications a ON t.app_id = a.id
      LEFT JOIN users req ON t.requested_by = req.id
      LEFT JOIN users app ON t.approved_by = app.id
      LEFT JOIN users exe ON t.executed_by = exe.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (appId) {
      sql += ' AND t.app_id = ?';
      params.push(appId);
    }
    if (operationType) {
      sql += ' AND t.operation_type = ?';
      params.push(operationType);
    }
    if (startDate) {
      sql += ' AND t.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND t.created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY t.created_at DESC';
    const tasks = await db.all(sql, params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await db.get(`
      SELECT t.*, a.name as app_name, 
             req.name as requested_by_name,
             app.name as approved_by_name,
             exe.name as executed_by_name
      FROM tasks t
      LEFT JOIN applications a ON t.app_id = a.id
      LEFT JOIN users req ON t.requested_by = req.id
      LEFT JOIN users app ON t.approved_by = app.id
      LEFT JOIN users exe ON t.executed_by = exe.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { app_id, operation_type, input_data, priority, rule_version } = req.body;

    if (!app_id || !operation_type || !input_data) {
      return res.status(400).json({ error: '应用ID、操作类型和输入数据为必填' });
    }

    const versionValid = await validateRuleVersion(app_id, rule_version || 1);
    if (!versionValid) {
      await createAlert(
        'version_mismatch',
        'warning',
        '规则版本不匹配警告',
        `任务请求的规则版本(${rule_version || 1})可能不是最新版本，已自动使用最新规则执行`,
        app_id,
        null,
        null
      );
    }

    const taskId = 'TSK-' + uuidv4().slice(0, 8).toUpperCase();

    const result = await db.run(
      `INSERT INTO tasks (task_id, app_id, operation_type, input_data, priority, rule_version, requested_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [taskId, app_id, operation_type, input_data, priority || 'medium', rule_version || 1, req.user.id, 'pending']
    );

    await createAuditLog(
      req.user.id,
      'create',
      'task',
      result.lastID,
      null,
      { taskId, app_id, operation_type },
      req.ip,
      req.get('User-Agent')
    );

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/approve', authenticateToken, requireRole('admin', 'ops', 'security'), async (req, res) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    if (task.status !== 'pending') {
      return res.status(400).json({ error: '只有待处理任务可以审批' });
    }

    const { remark } = req.body;

    await db.run(
      `UPDATE tasks SET status = 'approved', approved_by = ?, remark = ? WHERE id = ?`,
      [req.user.id, remark, req.params.id]
    );

    await createAuditLog(
      req.user.id,
      'approve',
      'task',
      req.params.id,
      { status: 'pending' },
      { status: 'approved' },
      req.ip,
      req.get('User-Agent')
    );

    const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/execute', authenticateToken, async (req, res) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    if (task.status !== 'approved') {
      return res.status(400).json({ error: '只有已审批任务可以执行' });
    }

    await db.run(
      `UPDATE tasks SET status = 'running', started_at = CURRENT_TIMESTAMP, executed_by = ? WHERE id = ?`,
      [req.user.id, req.params.id]
    );

    setTimeout(async () => {
      try {
        const startTime = Date.now();
        const { maskedContent, processedCount } = await maskContent(task.app_id, task.input_data);
        const duration = Date.now() - startTime;

        await db.run(
          `UPDATE tasks SET status = 'completed', output_data = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [maskedContent, req.params.id]
        );

        const logId = 'LOG-' + uuidv4().slice(0, 8).toUpperCase();
        const app = await db.get('SELECT api_key FROM applications WHERE id = ?', [task.app_id]);
        
        await db.run(
          `INSERT INTO call_logs (log_id, app_id, task_id, api_key, operation_type, request_method, request_path, 
                                  response_status, original_content, masked_content, processed_count, duration_ms, client_ip)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [logId, task.app_id, task.id, app ? app.api_key : '', task.operation_type, 'POST', '/api/mask',
           200, task.input_data, maskedContent, processedCount, duration, req.ip]
        );

        await createAuditLog(
          req.user.id,
          'execute',
          'task',
          req.params.id,
          { status: 'running' },
          { status: 'completed', processedCount },
          req.ip,
          req.get('User-Agent')
        );
      } catch (execErr) {
        await db.run(
          `UPDATE tasks SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [execErr.message, req.params.id]
        );

        await createAlert(
          'task_failed',
          'error',
          '任务执行失败',
          `任务 ${task.task_id} 执行失败: ${execErr.message}`,
          task.app_id,
          task.id,
          null
        );
      }
    }, 100);

    const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/retry', authenticateToken, async (req, res) => {
  try {
    const oldTask = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!oldTask) {
      return res.status(404).json({ error: '任务不存在' });
    }
    if (oldTask.status !== 'failed') {
      return res.status(400).json({ error: '只有失败任务可以重试' });
    }

    const taskId = 'TSK-' + uuidv4().slice(0, 8).toUpperCase();

    const result = await db.run(
      `INSERT INTO tasks (task_id, app_id, operation_type, input_data, priority, rule_version, requested_by, status, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [taskId, oldTask.app_id, oldTask.operation_type, oldTask.input_data, oldTask.priority, 
       oldTask.rule_version, req.user.id, 'pending', `重试任务，原任务ID: ${oldTask.task_id}`]
    );

    await createAuditLog(
      req.user.id,
      'retry',
      'task',
      result.lastID,
      { originalTaskId: oldTask.id },
      { newTaskId: result.lastID },
      req.ip,
      req.get('User-Agent')
    );

    const newTask = await db.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    if (!['pending', 'approved'].includes(task.status)) {
      return res.status(400).json({ error: '此状态的任务无法取消' });
    }

    await db.run(
      `UPDATE tasks SET status = 'cancelled' WHERE id = ?`,
      [req.params.id]
    );

    await createAuditLog(
      req.user.id,
      'cancel',
      'task',
      req.params.id,
      { status: task.status },
      { status: 'cancelled' },
      req.ip,
      req.get('User-Agent')
    );

    const updatedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
