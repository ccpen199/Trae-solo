import { Router } from 'express';
import { getDatabase } from '../database';
import { logger } from '../logger';
import { buildPagination, generateCode } from '../utils';
import { asyncHandler, AuthenticatedRequest, authMiddleware, permissionMiddleware } from '../middleware';
import { NotFoundError, BadRequestError } from '../errors';

export const auditRouter = Router();

auditRouter.use(authMiddleware);
auditRouter.use(permissionMiddleware(['audit:view']));

auditRouter.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const module = req.query.module as string;
    const action = req.query.action as string;
    const userId = req.query.userId as string;

    const db = getDatabase();

    let whereClause = '1=1';
    const params: any[] = [];

    if (module) {
      whereClause += ' AND module = ?';
      params.push(module);
    }

    if (action) {
      whereClause += ' AND action = ?';
      params.push(action);
    }

    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(parseInt(userId));
    }

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}
    `).get(...params);

    const total = countResult.total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const logs = db.prepare(`
      SELECT 
        al.*, u.username, u.real_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const response = {
      success: true,
      data: {
        list: logs.map((log: any) => ({
          id: log.id,
          auditCode: log.audit_code,
          userId: log.user_id,
          username: log.username,
          realName: log.real_name,
          module: log.module,
          action: log.action,
          targetType: log.target_type,
          targetId: log.target_id,
          oldValue: log.old_value ? JSON.parse(log.old_value) : null,
          newValue: log.new_value ? JSON.parse(log.new_value) : null,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: log.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

auditRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new BadRequestError('无效的审计日志ID');
    }

    const db = getDatabase();

    const log = db.prepare(`
      SELECT 
        al.*, u.username, u.real_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = ?
    `).get(id);

    if (!log) {
      throw new NotFoundError('审计日志不存在');
    }

    const response = {
      success: true,
      data: {
        id: log.id,
        auditCode: log.audit_code,
        userId: log.user_id,
        username: log.username,
        realName: log.real_name,
        module: log.module,
        action: log.action,
        targetType: log.target_type,
        targetId: log.target_id,
        oldValue: log.old_value ? JSON.parse(log.old_value) : null,
        newValue: log.new_value ? JSON.parse(log.new_value) : null,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

auditRouter.get(
  '/target/:targetType/:targetId',
  asyncHandler(async (req, res) => {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const db = getDatabase();

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM audit_logs 
      WHERE target_type = ? AND target_id = ?
    `).get(targetType, parseInt(targetId));

    const total = countResult.total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const logs = db.prepare(`
      SELECT 
        al.*, u.username, u.real_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.target_type = ? AND al.target_id = ?
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(targetType, parseInt(targetId), limit, offset);

    const response = {
      success: true,
      data: {
        list: logs.map((log: any) => ({
          id: log.id,
          auditCode: log.audit_code,
          userId: log.user_id,
          username: log.username,
          realName: log.real_name,
          module: log.module,
          action: log.action,
          oldValue: log.old_value ? JSON.parse(log.old_value) : null,
          newValue: log.new_value ? JSON.parse(log.new_value) : null,
          ipAddress: log.ip_address,
          createdAt: log.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

auditRouter.get(
  '/phone/:phoneNumber',
  asyncHandler(async (req, res) => {
    const { phoneNumber } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const db = getDatabase();

    const smsRecords = db.prepare(`
      SELECT id FROM sms_records WHERE phone_number = ?
    `).all(phoneNumber);

    const smsIds = smsRecords.map((r: any) => r.id);

    if (smsIds.length === 0) {
      const response = {
        success: true,
        data: {
          list: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        },
        timestamp: new Date().toISOString(),
      };
      res.json(response);
      return;
    }

    const placeholders = smsIds.map(() => '?').join(',');

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM audit_logs 
      WHERE (target_type = 'sms_record' AND target_id IN (${placeholders}))
         OR (target_type = 'sms_template')
    `).get(...smsIds);

    const total = countResult.total;
    const { offset, limit, totalPages } = buildPagination(page, pageSize, total);

    const logs = db.prepare(`
      SELECT 
        al.*, u.username, u.real_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE (al.target_type = 'sms_record' AND al.target_id IN (${placeholders}))
         OR (al.target_type = 'sms_template')
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...smsIds, limit, offset);

    const response = {
      success: true,
      data: {
        list: logs.map((log: any) => ({
          id: log.id,
          auditCode: log.audit_code,
          userId: log.user_id,
          username: log.username,
          realName: log.real_name,
          module: log.module,
          action: log.action,
          targetType: log.target_type,
          targetId: log.target_id,
          oldValue: log.old_value ? JSON.parse(log.old_value) : null,
          newValue: log.new_value ? JSON.parse(log.new_value) : null,
          ipAddress: log.ip_address,
          createdAt: log.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);
