import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, action, department_id } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  
  let query = `
    SELECT al.*, d.name as department_name
    FROM audit_logs al
    LEFT JOIN departments d ON al.department_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (action) {
    query += ' AND al.action = ?';
    params.push(action);
  }
  
  if (department_id) {
    query += ' AND al.department_id = ?';
    params.push(department_id);
  }
  
  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize as string), offset);
  
  const logs = db.prepare(query).all(...params);
  
  let countQuery = 'SELECT COUNT(*) as count FROM audit_logs al WHERE 1=1';
  const countParams: any[] = [];
  
  if (action) {
    countQuery += ' AND al.action = ?';
    countParams.push(action);
  }
  
  if (department_id) {
    countQuery += ' AND al.department_id = ?';
    countParams.push(department_id);
  }
  
  const total = db.prepare(countQuery).get(...countParams) as { count: number };
  
  res.json({ data: logs, total: total.count, page: parseInt(page as string), pageSize: parseInt(pageSize as string) });
});

router.post('/export', (req, res) => {
  const { start_date, end_date, action, department_id, format = 'csv' } = req.body;
  
  let query = `
    SELECT al.*, d.name as department_name
    FROM audit_logs al
    LEFT JOIN departments d ON al.department_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (start_date) {
    query += ' AND DATE(al.created_at) >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND DATE(al.created_at) <= ?';
    params.push(end_date);
  }
  
  if (action) {
    query += ' AND al.action = ?';
    params.push(action);
  }
  
  if (department_id) {
    query += ' AND al.department_id = ?';
    params.push(department_id);
  }
  
  query += ' ORDER BY al.created_at DESC';
  
  const logs = db.prepare(query).all(...params) as any[];
  
  db.prepare(`
    INSERT INTO audit_logs (action, target_type, details)
    VALUES ('export_audit', 'audit_logs', ?)
  `).run(`导出审计日志 ${logs.length} 条`);
  
  const actionLabels: Record<string, string> = {
    create_application: '创建申请',
    approve_application: '审批通过',
    reject_application: '审批拒绝',
    export_audit: '导出审计日志'
  };
  
  if (format === 'csv') {
    const headers = ['ID', '操作类型', '操作人', '部门', '目标类型', '目标ID', '详情', 'IP地址', '操作时间'];
    const rows = logs.map(log => [
      log.id,
      actionLabels[log.action] || log.action,
      log.operator || '系统',
      log.department_name || '-',
      log.target_type || '-',
      log.target_id || '-',
      log.details || '-',
      log.ip_address || '-',
      log.created_at
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const filename = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send('\uFEFF' + csvContent);
  } else {
    res.json({ data: logs, count: logs.length });
  }
});

export default router;
