import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('exception', 'handle'), (req, res) => {
  const { status, severity, exception_type, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT e.*, t.task_no, a.app_name, u.real_name as handler_name
    FROM exceptions e
    LEFT JOIN tasks t ON e.task_id = t.id
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN users u ON e.handled_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }
  if (severity) {
    query += ' AND e.severity = ?';
    params.push(severity);
  }
  if (exception_type) {
    query += ' AND e.exception_type = ?';
    params.push(exception_type);
  }

  const totalResult = db.prepare(query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM')).get(...params);
  const total = totalResult ? totalResult.count : 0;
  
  query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const exceptions = db.prepare(query).all(...params);

  res.json({
    list: exceptions,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:id', checkPermission('exception', 'handle'), (req, res) => {
  const exception = db.prepare(`
    SELECT e.*, t.task_no, a.app_name, u.real_name as handler_name
    FROM exceptions e
    LEFT JOIN tasks t ON e.task_id = t.id
    LEFT JOIN applications a ON t.app_id = a.id
    LEFT JOIN users u ON e.handled_by = u.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  res.json(exception);
});

router.post('/:id/handle', checkPermission('exception', 'handle'), (req, res) => {
  const { id } = req.params;
  const { compensation_action, status, manual_note } = req.body;

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  db.prepare(`
    UPDATE exceptions 
    SET compensation_action = ?, status = ?, manual_note = ?, 
        handled_by = ?, handled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    compensation_action || exception.compensation_action,
    status || exception.status,
    manual_note || exception.manual_note,
    req.user.id,
    id
  );

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('exception', ?, ?, 'handle', 'exception', ?, ?, ?)
  `).run(req.user.id, req.user.username, id, exception.exception_no, `处理异常: ${exception.exception_no}，状态: ${status}`);

  res.json({ message: '异常处理记录已更新' });
});

router.post('/:id/compensate', checkPermission('exception', 'handle'), (req, res) => {
  const { id } = req.params;
  const { compensation_result } = req.body;

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  db.prepare(`
    UPDATE exceptions 
    SET compensation_status = 'success', compensation_result = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(compensation_result || {}), id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('exception', ?, ?, 'compensate', 'exception', ?, ?, ?)
  `).run(req.user.id, req.user.username, id, exception.exception_no, `执行补偿动作: ${exception.exception_no}`);

  res.json({ message: '补偿执行成功' });
});

export default router;
