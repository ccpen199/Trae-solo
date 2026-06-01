const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, priority, assignee_id, meeting_id, due_from, due_to, search } = req.query;
  
  let query = `
    SELECT ai.*, 
           u.name as assignee_name,
           m.title as meeting_title,
           m.meeting_date,
           CASE 
             WHEN ai.status = 'completed' THEN 'completed'
             WHEN ai.status = 'cancelled' THEN 'cancelled'
             WHEN ai.due_date < DATE('now') AND ai.status != 'completed' THEN 'overdue'
             ELSE ai.status
           END as display_status
    FROM action_items ai
    LEFT JOIN users u ON ai.assignee_id = u.id
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    if (status === 'overdue') {
      query += ' AND ai.due_date < DATE(\'now\') AND ai.status != \'completed\' AND ai.status != \'cancelled\'';
    } else {
      query += ' AND ai.status = ?';
      params.push(status);
    }
  }
  if (priority) {
    query += ' AND ai.priority = ?';
    params.push(priority);
  }
  if (assignee_id) {
    query += ' AND ai.assignee_id = ?';
    params.push(assignee_id);
  }
  if (meeting_id) {
    query += ' AND ai.meeting_id = ?';
    params.push(meeting_id);
  }
  if (due_from) {
    query += ' AND ai.due_date >= ?';
    params.push(due_from);
  }
  if (due_to) {
    query += ' AND ai.due_date <= ?';
    params.push(due_to);
  }
  if (search) {
    query += ' AND (ai.title LIKE ? OR ai.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY ai.priority DESC, ai.due_date ASC, ai.created_at DESC';

  const actionItems = db.prepare(query).all(...params);
  res.json(actionItems);
});

router.get('/workbench/issues', authenticateToken, (req, res) => {
  const issues = [];

  const wrongAssignee = db.prepare(`
    SELECT ai.*, u.name as assignee_name, m.title as meeting_title,
           'wrong_assignee' as issue_type,
           '负责人可能识别错误，请确认' as issue_description,
           '重新分配正确负责人' as suggested_action,
           '负责人确认后可关闭' as close_condition
    FROM action_items ai
    LEFT JOIN users u ON ai.assignee_id = u.id
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE ai.status = 'pending'
    AND ai.assignee_id IS NULL
    ORDER BY ai.created_at DESC
  `).all();
  issues.push(...wrongAssignee);

  const missingDueDate = db.prepare(`
    SELECT ai.*, u.name as assignee_name, m.title as meeting_title,
           'missing_due_date' as issue_type,
           '截止时间缺失，需要补全' as issue_description,
           '设置合理的截止日期' as suggested_action,
           '设置截止日期后可关闭' as close_condition
    FROM action_items ai
    LEFT JOIN users u ON ai.assignee_id = u.id
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE ai.status != 'completed' AND ai.status != 'cancelled'
    AND ai.due_date IS NULL
    ORDER BY ai.created_at DESC
  `).all();
  issues.push(...missingDueDate);

  const duplicates = db.prepare(`
    SELECT ai1.*, u.name as assignee_name, m.title as meeting_title,
           'duplicate' as issue_type,
           '可能存在重复任务，请检查' as issue_description,
           '确认并合并或删除重复项' as suggested_action,
           '确认无重复后可关闭' as close_condition
    FROM action_items ai1
    LEFT JOIN users u ON ai1.assignee_id = u.id
    LEFT JOIN meetings m ON ai1.meeting_id = m.id
    WHERE EXISTS (
      SELECT 1 FROM action_items ai2 
      WHERE ai2.title = ai1.title 
      AND ai2.id != ai1.id
      AND ai2.status != 'cancelled'
    )
    AND ai1.status != 'cancelled'
    ORDER BY ai1.created_at DESC
  `).all();
  issues.push(...duplicates);

  const reminderFailures = db.prepare(`
    SELECT ai.*, u.name as assignee_name, m.title as meeting_title,
           'reminder_failed' as issue_type,
           '提醒发送失败，需要重试' as issue_description,
           '手动通知或重新设置提醒' as suggested_action,
           '提醒成功或确认已通知后可关闭' as close_condition
    FROM action_items ai
    LEFT JOIN users u ON ai.assignee_id = u.id
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE ai.reminder_failed > 0
    AND ai.status != 'completed'
    ORDER BY ai.reminder_failed DESC
  `).all();
  issues.push(...reminderFailures);

  res.json(issues);
});

router.get('/:id', authenticateToken, (req, res) => {
  const actionItem = db.prepare(`
    SELECT ai.*, 
           u.name as assignee_name,
           m.title as meeting_title,
           m.meeting_date
    FROM action_items ai
    LEFT JOIN users u ON ai.assignee_id = u.id
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE ai.id = ?
  `).get(req.params.id);
  
  if (!actionItem) {
    return res.status(404).json({ error: '行动项不存在' });
  }
  
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name
    FROM action_item_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.action_item_id = ?
    ORDER BY c.created_at DESC
  `).all(req.params.id);

  const auditLogs = db.prepare(`
    SELECT * FROM audit_logs 
    WHERE entity_type = 'action_item' AND entity_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id);

  const reminders = db.prepare(`
    SELECT * FROM reminders 
    WHERE action_item_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({ ...actionItem, comments, audit_logs: auditLogs, reminders });
});

router.post('/', authenticateToken, (req, res) => {
  const { meeting_id, title, description, assignee_id, due_date, priority } = req.body;

  const validationErrors = [];
  if (!title || title.trim() === '') {
    validationErrors.push('行动项标题不能为空');
  }
  if (!meeting_id) {
    validationErrors.push('必须关联会议');
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO action_items (id, meeting_id, title, description, assignee_id, due_date, priority, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, meeting_id, title, description, assignee_id, due_date, priority || 'medium', req.user.id);

  if (due_date) {
    const reminderId = uuidv4();
    const scheduledAt = new Date(due_date);
    scheduledAt.setDate(scheduledAt.getDate() - 1);
    
    db.prepare(`
      INSERT INTO reminders (id, action_item_id, reminder_type, scheduled_at, recipient_id)
      VALUES (?, ?, 'due_soon', ?, ?)
    `).run(reminderId, id, scheduledAt.toISOString(), assignee_id);
  }

  createAuditLog({
    actionType: 'create',
    entityType: 'action_item',
    entityId: id,
    operatorId: req.user.id,
    operatorName: req.user.name,
    reason: '创建行动项',
    newValue: { meeting_id, title, description, assignee_id, due_date, priority },
    affectedObjects: `meeting:${meeting_id}`,
    recoveryPath: `/action-items/${id}/edit`
  });

  const actionItem = db.prepare('SELECT * FROM action_items WHERE id = ?').get(id);
  res.status(201).json(actionItem);
});

router.post('/batch', authenticateToken, (req, res) => {
  const { ids, action, data } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择要处理的行动项' });
  }
  if (!action) {
    return res.status(400).json({ error: '请指定批量操作类型' });
  }

  const results = [];
  
  for (const id of ids) {
    try {
      const oldItem = db.prepare('SELECT * FROM action_items WHERE id = ?').get(id);
      if (!oldItem) continue;

      let newValue = { ...oldItem };

      if (action === 'complete') {
        db.prepare('UPDATE action_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', id);
        newValue.status = 'completed';
      } else if (action === 'cancel') {
        db.prepare('UPDATE action_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', id);
        newValue.status = 'cancelled';
      } else if (action === 'reassign' && data.assignee_id) {
        db.prepare('UPDATE action_items SET assignee_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.assignee_id, id);
        newValue.assignee_id = data.assignee_id;
      } else if (action === 'update_due' && data.due_date) {
        db.prepare('UPDATE action_items SET due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.due_date, id);
        newValue.due_date = data.due_date;
      }

      createAuditLog({
        actionType: `batch_${action}`,
        entityType: 'action_item',
        entityId: id,
        operatorId: req.user.id,
        operatorName: req.user.name,
        reason: `批量${action === 'complete' ? '完成' : action === 'cancel' ? '取消' : '更新'}行动项`,
        oldValue: oldItem,
        newValue: newValue,
        recoveryPath: `/action-items/${id}/revert`
      });

      results.push({ id, success: true });
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }

  res.json({ results, total: ids.length, success_count: results.filter(r => r.success).length });
});

router.put('/:id', authenticateToken, (req, res) => {
  const { meeting_id, title, description, assignee_id, due_date, priority, status } = req.body;
  const itemId = req.params.id;

  const oldItem = db.prepare('SELECT * FROM action_items WHERE id = ?').get(itemId);
  if (!oldItem) {
    return res.status(404).json({ error: '行动项不存在' });
  }

  const validationErrors = [];
  if (title && title.trim() === '') {
    validationErrors.push('行动项标题不能为空');
  }
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const stmt = db.prepare(`
    UPDATE action_items 
    SET meeting_id = COALESCE(?, meeting_id),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        assignee_id = ?,
        due_date = ?,
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(meeting_id, title, description, assignee_id, due_date, priority, status, itemId);

  createAuditLog({
    actionType: 'update',
    entityType: 'action_item',
    entityId: itemId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    reason: '更新行动项',
    oldValue: oldItem,
    newValue: { meeting_id, title, description, assignee_id, due_date, priority, status },
    recoveryPath: `/action-items/${itemId}/revert`
  });

  const actionItem = db.prepare('SELECT * FROM action_items WHERE id = ?').get(itemId);
  res.json(actionItem);
});

router.delete('/:id', authenticateToken, (req, res) => {
  const itemId = req.params.id;
  const oldItem = db.prepare('SELECT * FROM action_items WHERE id = ?').get(itemId);
  
  if (!oldItem) {
    return res.status(404).json({ error: '行动项不存在' });
  }

  db.prepare('UPDATE action_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', itemId);

  createAuditLog({
    actionType: 'delete',
    entityType: 'action_item',
    entityId: itemId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    reason: '删除/取消行动项',
    oldValue: oldItem,
    recoveryPath: `/action-items/${itemId}/restore`
  });

  res.json({ message: '行动项已取消' });
});

router.post('/:id/comments', authenticateToken, (req, res) => {
  const { content } = req.body;
  const itemId = req.params.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: '评论内容不能为空' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO action_item_comments (id, action_item_id, user_id, content)
    VALUES (?, ?, ?, ?)
  `).run(id, itemId, req.user.id, content);

  const comment = db.prepare(`
    SELECT c.*, u.name as user_name
    FROM action_item_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(id);

  res.status(201).json(comment);
});

module.exports = router;
