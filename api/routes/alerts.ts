import { Router, Response } from 'express';
import db from '../database/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { operationLog } from '../middleware/logger.js';
import { getAccessibleSchoolIds } from '../middleware/permission.js';
import { success, error } from '../utils/response.js';
import type { AlertRecord, AlertQueryParams, AlertProcessRequest, PageResponse } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, operationLog('alerts', '获取预警列表'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);
  if (accessibleSchoolIds && accessibleSchoolIds.length === 0) {
    res.json(success<PageResponse<AlertRecord>>({ list: [], total: 0, page: 1, pageSize: 10 }));
    return;
  }

  const { page = 1, pageSize = 10, schoolId, type, level, status } = req.query as AlertQueryParams;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (accessibleSchoolIds) {
    whereClause += ` AND a.school_id IN (${accessibleSchoolIds.map(() => '?').join(',')})`;
    params.push(...accessibleSchoolIds);
  }

  if (schoolId) {
    if (!accessibleSchoolIds || accessibleSchoolIds.includes(Number(schoolId))) {
      whereClause += ' AND a.school_id = ?';
      params.push(Number(schoolId));
    }
  }

  if (type) {
    whereClause += ' AND a.type = ?';
    params.push(type);
  }

  if (level) {
    whereClause += ' AND a.level = ?';
    params.push(level);
  }

  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  const countSql = `
    SELECT COUNT(*) as total
    FROM alert_records a
    ${whereClause}
  `;

  const { total } = db.prepare(countSql).get(...params) as { total: number };

  const listSql = `
    SELECT a.*, sc.name as school_name
    FROM alert_records a
    LEFT JOIN schools sc ON a.school_id = sc.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(listSql).all(...params, Number(pageSize), offset) as Array<{
    id: number;
    school_id: number;
    type: string;
    level: string;
    student_id?: number;
    student_name?: string;
    title: string;
    description: string;
    status: string;
    handler_id?: number;
    handler_name?: string;
    handle_time?: string;
    handle_remark?: string;
    created_at: string;
    school_name: string;
  }>;

  const list: AlertRecord[] = rows.map(row => ({
    id: row.id,
    schoolId: row.school_id,
    type: row.type as 'abnormal_leave' | 'absent' | 'funding_exception',
    level: row.level as 'low' | 'medium' | 'high',
    studentId: row.student_id,
    studentName: row.student_name,
    title: row.title,
    description: row.description,
    status: row.status as 'pending' | 'processing' | 'resolved',
    handlerId: row.handler_id,
    handlerName: row.handler_name,
    handleTime: row.handle_time,
    handleRemark: row.handle_remark,
    createdAt: row.created_at,
    schoolName: row.school_name,
  }));

  res.json(success<PageResponse<AlertRecord>>({
    list,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  }));
});

router.put('/:id/process', authMiddleware, operationLog('alerts', '处理预警'), (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { status, remark } = req.body as AlertProcessRequest;
  const accessibleSchoolIds = getAccessibleSchoolIds(req);

  if (!status) {
    res.status(400).json(error('状态不能为空'));
    return;
  }

  const validStatuses = ['pending', 'processing', 'resolved'];
  if (!validStatuses.includes(status)) {
    res.status(400).json(error('无效的状态值'));
    return;
  }

  const existing = db.prepare('SELECT school_id, status FROM alert_records WHERE id = ?').get(Number(id)) as { school_id: number; status: string } | undefined;
  if (!existing) {
    res.status(404).json(error('预警记录不存在'));
    return;
  }

  if (accessibleSchoolIds && !accessibleSchoolIds.includes(existing.school_id)) {
    res.status(403).json(error('无权限操作该学校的数据'));
    return;
  }

  if (!req.user) {
    res.status(401).json(error('未登录'));
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE alert_records
    SET status = ?, handler_id = ?, handler_name = ?, handle_time = ?, handle_remark = ?
    WHERE id = ?
  `).run(
    status,
    req.user.id,
    req.user.username,
    now,
    remark || '',
    Number(id)
  );

  res.json(success(null, '预警处理成功'));
});

export default router;
