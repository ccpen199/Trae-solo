import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware.js';
import type { AuditLog } from '../types.js';

const router = Router();

router.get('/', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const action = req.query.action as string | undefined;
  const resourceType = req.query.resource_type as string | undefined;
  const userId = req.query.user_id as string | undefined;
  const startDate = req.query.start_date as string | undefined;
  const endDate = req.query.end_date as string | undefined;
  const keyword = req.query.keyword as string | undefined;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (action) {
    where += ' AND a.action = ?';
    params.push(action);
  }
  if (resourceType) {
    where += ' AND a.resource_type = ?';
    params.push(resourceType);
  }
  if (userId) {
    where += ' AND a.user_id = ?';
    params.push(parseInt(userId));
  }
  if (startDate) {
    where += ' AND a.created_at >= ?';
    params.push(`${startDate} 00:00:00`);
  }
  if (endDate) {
    where += ' AND a.created_at <= ?';
    params.push(`${endDate} 23:59:59`);
  }
  if (keyword) {
    where += ' AND (a.detail LIKE ? OR u.name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM audit_logs a
    INNER JOIN users u ON a.user_id = u.id
    ${where}
  `).get(...params) as { count: number };

  const list = db.prepare(`
    SELECT a.*, u.name as user_name
    FROM audit_logs a
    INNER JOIN users u ON a.user_id = u.id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as AuditLog[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/:id', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const log = db.prepare(`
    SELECT a.*, u.name as user_name
    FROM audit_logs a
    INNER JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `).get(id) as AuditLog | undefined;

  if (!log) {
    res.status(404).json({ success: false, error: '审计日志不存在' });
    return;
  }

  res.json({ success: true, data: log });
});

router.get('/options/actions', authenticate, (req: AuthRequest, res: Response): void => {
  const actions = [
    { value: 'login', label: '登录' },
    { value: 'logout', label: '登出' },
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
    { value: 'delete', label: '删除' },
    { value: 'approve', label: '审批通过' },
    { value: 'reject', label: '审批拒绝' },
    { value: 'activate', label: '激活' },
    { value: 'deactivate', label: '停用' },
    { value: 'upgrade', label: '升级' },
    { value: 'export', label: '导出' },
  ];
  res.json({ success: true, data: actions });
});

router.get('/options/resources', authenticate, (req: AuthRequest, res: Response): void => {
  const resources = [
    { value: 'user', label: '用户' },
    { value: 'fleet', label: '车队' },
    { value: 'vehicle', label: '车辆' },
    { value: 'obu_device', label: 'OBU设备' },
    { value: 'toll_record', label: '通行记录' },
    { value: 'monthly_bill', label: '月结单' },
    { value: 'appeal', label: '申诉' },
    { value: 'etc_account', label: 'ETC账户' },
    { value: 'obu_upgrade_task', label: '升级任务' },
    { value: 'auth', label: '认证' },
    { value: 'system', label: '系统' },
  ];
  res.json({ success: true, data: resources });
});

export default router;
