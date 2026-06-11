import { Router, Response } from 'express';
import db from '../database/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { operationLog } from '../middleware/logger.js';
import { getAccessibleSchoolIds } from '../middleware/permission.js';
import { success, error } from '../utils/response.js';
import type { OperationLog, LogQueryParams, PageResponse } from '../../shared/types.js';

const router = Router();

router.get('/', authMiddleware, operationLog('logs', '获取操作日志'), (req: AuthRequest, res: Response): void => {
  const accessibleSchoolIds = getAccessibleSchoolIds(req);

  const { page = 1, pageSize = 10, userId, module, startDate, endDate } = req.query as LogQueryParams;
  const offset = (Number(page) - 1) * Number(pageSize);

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (userId) {
    whereClause += ' AND user_id = ?';
    params.push(Number(userId));
  }

  if (module) {
    whereClause += ' AND module = ?';
    params.push(module);
  }

  if (startDate) {
    whereClause += ' AND DATE(created_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND DATE(created_at) <= ?';
    params.push(endDate);
  }

  const countSql = `
    SELECT COUNT(*) as total
    FROM operation_logs
    ${whereClause}
  `;

  const { total } = db.prepare(countSql).get(...params) as { total: number };

  const listSql = `
    SELECT *
    FROM operation_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(listSql).all(...params, Number(pageSize), offset) as Array<{
    id: number;
    user_id: number;
    user_name: string;
    operation: string;
    module: string;
    ip: string;
    user_agent: string;
    detail?: string;
    created_at: string;
  }>;

  const list: OperationLog[] = rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    operation: row.operation,
    module: row.module,
    ip: row.ip,
    userAgent: row.user_agent,
    detail: row.detail,
    createdAt: row.created_at,
  }));

  res.json(success<PageResponse<OperationLog>>({
    list,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  }));
});

export default router;
