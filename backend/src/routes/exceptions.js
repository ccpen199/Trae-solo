const express = require('express');
const router = express.Router();
const db = require('../database');
const { exceptionSchema } = require('../utils/validation');

router.get('/', (req, res) => {
  const { status, container_id } = req.query;
  
  let query = 'SELECT * FROM exceptions WHERE 1=1';
  const params = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (container_id) {
    query += ' AND container_id = ?';
    params.push(container_id);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const exceptions = db.prepare(query).all(...params);
  res.json(exceptions);
});

router.get('/:id', (req, res) => {
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!exception) {
    return res.status(404).json({ error: '异常不存在' });
  }
  res.json(exception);
});

router.post('/', (req, res) => {
  const { error, value } = exceptionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const container = db.prepare('SELECT id FROM containers WHERE id = ?').get(value.container_id);
  if (!container) {
    return res.status(404).json({ error: '箱号不存在' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO exceptions (container_id, exception_type, description, responsible_party, action_taken)
    VALUES (@container_id, @exception_type, @description, @responsible_party, @action_taken)
  `);
  
  const result = stmt.run(value);
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(exception);
});

router.put('/:id/status', (req, res) => {
  const { status, note, created_by = '系统' } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: '状态不能为空' });
  }
  
  const validStatuses = ['open', 'processing', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  if (!exception) {
    return res.status(404).json({ error: '异常不存在' });
  }
  
  const oldStatus = exception.status;
  
  // 1. 更新异常状态
  const updateData = {
    id: req.params.id,
    status,
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    resolved_by: status === 'resolved' ? created_by : null,
    resolve_note: status === 'resolved' ? note : null
  };
  
  const updateStmt = db.prepare(`
    UPDATE exceptions 
    SET status = @status, 
        resolved_at = @resolved_at,
        resolved_by = @resolved_by,
        resolve_note = @resolve_note
    WHERE id = @id
  `);
  updateStmt.run(updateData);
  
  // 2. 记录处理日志
  const logStmt = db.prepare(`
    INSERT INTO exception_logs (exception_id, action, old_status, new_status, note, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  logStmt.run(req.params.id, 'status_change', oldStatus, status, note, created_by);
  
  // 3. 同步更新箱号的异常标记
  const container = db.prepare('SELECT * FROM containers WHERE id = ?').get(exception.container_id);
  if (container) {
    // 检查是否还有其他未解决的异常
    const openExceptions = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE container_id = ? AND status IN ('open', 'processing')").get(exception.container_id).count;
    
    db.prepare('UPDATE containers SET has_exception = ? WHERE id = ?').run(openExceptions > 0 ? 1 : 0, exception.container_id);
  }
  
  // 4. 创建通知
  if (status === 'resolved') {
    const notifyStmt = db.prepare(`
      INSERT INTO notifications (container_id, exception_id, type, title, content, recipient)
      VALUES (?, ?, 'exception_resolved', '异常已解决', ?, ?)
    `);
    notifyStmt.run(
      exception.container_id,
      exception.id,
      `异常已解决: ${exception.exception_type} - ${note || '已处理完成'}`,
      container ? container.shipper : '客户'
    );
  }
  
  // 返回更新后的异常信息（包含处理日志）
  const updatedException = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  const logs = db.prepare('SELECT * FROM exception_logs WHERE exception_id = ? ORDER BY created_at DESC').all(req.params.id);
  
  res.json({
    ...updatedException,
    logs
  });
});

router.put('/:id', (req, res) => {
  const { error, value } = exceptionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const stmt = db.prepare(`
    UPDATE exceptions 
    SET exception_type = @exception_type, description = @description, 
        responsible_party = @responsible_party, action_taken = @action_taken
    WHERE id = @id
  `);
  
  stmt.run({ ...value, id: req.params.id });
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  
  if (!exception) {
    return res.status(404).json({ error: '异常不存在' });
  }
  
  res.json(exception);
});

// 获取异常处理日志
router.get('/:id/logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM exception_logs WHERE exception_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(logs);
});

// 获取通知列表
router.get('/notifications/list', (req, res) => {
  const unreadOnly = req.query.unread_only === 'true';
  
  let query = `
    SELECT n.*, c.container_number, c.shipper
    FROM notifications n
    LEFT JOIN containers c ON n.container_id = c.id
  `;
  
  if (unreadOnly) {
    query += ' WHERE n.is_read = 0';
  }
  query += ' ORDER BY n.created_at DESC LIMIT 50';
  
  const notifications = db.prepare(query).all();
  res.json(notifications);
});

// 标记通知为已读
router.put('/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 获取未读通知数量
router.get('/notifications/unread-count', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get().count;
  res.json({ count });
});

// ==================== 异常处理步骤 ====================

// 获取异常的所有处理步骤
router.get('/:id/steps', (req, res) => {
  const steps = db.prepare(`
    SELECT s.*, 
           (SELECT COUNT(*) FROM attachments WHERE step_id = s.id) as attachment_count
    FROM exception_steps s 
    WHERE s.exception_id = ? 
    ORDER BY s.created_at ASC
  `).all(req.params.id);
  
  // 为每个步骤获取附件
  const stepsWithAttachments = steps.map(step => {
    const attachments = db.prepare('SELECT * FROM attachments WHERE step_id = ?').all(step.id);
    return { ...step, attachments };
  });
  
  res.json(stepsWithAttachments);
});

// 添加处理步骤
router.post('/:id/steps', (req, res) => {
  const { step_type, title, description, operator } = req.body;
  
  if (!step_type || !title || !operator) {
    return res.status(400).json({ error: '类型、标题、操作人为必填项' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO exception_steps (exception_id, step_type, title, description, operator)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(req.params.id, step_type, title, description || '', operator);
  
  const step = db.prepare('SELECT * FROM exception_steps WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(step);
});

// ==================== 客户反馈 ====================

// 获取异常的客户反馈
router.get('/:id/feedback', (req, res) => {
  const feedback = db.prepare(`
    SELECT f.*,
           (SELECT COUNT(*) FROM attachments WHERE feedback_id = f.id) as attachment_count
    FROM customer_feedback f 
    WHERE f.exception_id = ? 
    ORDER BY f.created_at DESC
  `).all(req.params.id);
  
  // 为每个反馈获取附件
  const feedbackWithAttachments = feedback.map(f => {
    const attachments = db.prepare('SELECT * FROM attachments WHERE feedback_id = ?').all(f.id);
    return { ...f, attachments };
  });
  
  res.json(feedbackWithAttachments);
});

// 添加客户反馈
router.post('/:id/feedback', (req, res) => {
  const { feedback_type, content, contact_person, contact_phone, feedback_time, created_by } = req.body;
  
  if (!feedback_type || !content || !created_by) {
    return res.status(400).json({ error: '类型、内容、创建人为必填项' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO customer_feedback (exception_id, feedback_type, content, contact_person, contact_phone, feedback_time, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    req.params.id, 
    feedback_type, 
    content, 
    contact_person || null, 
    contact_phone || null, 
    feedback_time || null, 
    created_by
  );
  
  const feedback = db.prepare('SELECT * FROM customer_feedback WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(feedback);
});

// ==================== 文件附件 ====================

// 获取异常的所有附件
router.get('/:id/attachments', (req, res) => {
  const attachments = db.prepare(`
    SELECT * FROM attachments 
    WHERE exception_id = ? OR step_id IN (SELECT id FROM exception_steps WHERE exception_id = ?)
    ORDER BY uploaded_at DESC
  `).all(req.params.id, req.params.id);
  
  res.json(attachments);
});

// 上传附件（简单实现，实际项目应使用multer等中间件）
router.post('/:id/attachments', (req, res) => {
  const { file_name, file_path, file_size, file_type, uploaded_by, step_id, feedback_id } = req.body;
  
  if (!file_name || !file_path || !uploaded_by) {
    return res.status(400).json({ error: '文件名、路径、上传人为必填项' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO attachments (exception_id, step_id, feedback_id, file_name, file_path, file_size, file_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    req.params.id,
    step_id || null,
    feedback_id || null,
    file_name,
    file_path,
    file_size || null,
    file_type || null,
    uploaded_by
  );
  
  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(attachment);
});

// 获取异常完整信息（包含步骤、反馈、附件）
router.get('/:id/full', (req, res) => {
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
  
  if (!exception) {
    return res.status(404).json({ error: '异常不存在' });
  }
  
  // 获取处理步骤（带附件）
  const steps = db.prepare(`
    SELECT * FROM exception_steps WHERE exception_id = ? ORDER BY created_at ASC
  `).all(req.params.id);
  
  const stepsWithAttachments = steps.map(step => {
    const attachments = db.prepare('SELECT * FROM attachments WHERE step_id = ?').all(step.id);
    return { ...step, attachments };
  });
  
  // 获取客户反馈（带附件）
  const feedback = db.prepare(`
    SELECT * FROM customer_feedback WHERE exception_id = ? ORDER BY created_at DESC
  `).all(req.params.id);
  
  const feedbackWithAttachments = feedback.map(f => {
    const attachments = db.prepare('SELECT * FROM attachments WHERE feedback_id = ?').all(f.id);
    return { ...f, attachments };
  });
  
  // 获取所有附件
  const allAttachments = db.prepare(`
    SELECT * FROM attachments 
    WHERE exception_id = ? OR step_id IN (SELECT id FROM exception_steps WHERE exception_id = ?)
    ORDER BY uploaded_at DESC
  `).all(req.params.id, req.params.id);
  
  res.json({
    exception,
    steps: stepsWithAttachments,
    feedback: feedbackWithAttachments,
    attachments: allAttachments
  });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM exceptions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '异常不存在' });
  }
  res.json({ message: '删除成功' });
});

module.exports = router;
