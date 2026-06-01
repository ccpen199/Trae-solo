import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('audit', 'read'), (req, res) => {
  const { 
    user_id, audit_type, permission_granted, risk_level,
    start_date, end_date, keyword, page = 1, pageSize = 20 
  } = req.query;
  
  let query = `
    SELECT al.*, u.real_name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (user_id) {
    query += ' AND al.user_id = ?';
    params.push(user_id);
  }
  if (audit_type) {
    query += ' AND al.audit_type = ?';
    params.push(audit_type);
  }
  if (permission_granted !== undefined) {
    query += ' AND al.permission_granted = ?';
    params.push(permission_granted === 'true' ? 1 : 0);
  }
  if (risk_level) {
    query += ' AND al.risk_level = ?';
    params.push(risk_level);
  }
  if (start_date) {
    query += ' AND al.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND al.created_at <= ?';
    params.push(end_date);
  }
  if (keyword) {
    query += ' AND (al.username LIKE ? OR al.action LIKE ? OR al.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const totalResult = db.prepare(query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM')).get(...params);
  const total = totalResult ? totalResult.count : 0;
  
  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const logs = db.prepare(query).all(...params);

  res.json({
    list: logs,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/export', checkPermission('audit', 'export'), (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT al.created_at as 时间, al.username as 用户名, al.audit_type as 类型, 
           al.action as 操作, al.resource_type as 资源类型, al.resource_name as 资源名称,
           al.permission_granted as 权限结果, al.risk_level as 风险等级, al.description as 描述,
           al.ip_address as IP地址
    FROM audit_logs al
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    query += ' AND al.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND al.created_at <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY al.created_at DESC LIMIT 10000';

  const logs = db.prepare(query).all(...params);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, description)
    VALUES ('export', ?, ?, 'export', 'audit', ?)
  `).run(req.user.id, req.user.username, `导出审计日志，共${logs.length}条`);

  res.json({
    data: logs,
    filename: `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`
  });
});

export default router;
