import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireAnyPermission } from '../middleware/permission.js'
import type {
  ApiResponse,
  PaginatedResponse,
  AuditLog,
  LoginLog,
} from '../../shared/types.js'

const router = Router()

function buildAuditQuery(user: Express.Request['user']): { where: string; params: unknown[] } {
  const conditions: string[] = []
  const params: unknown[] = []

  if (user?.role === 'outlet_admin') {
    conditions.push(
      'a.user_id IN (SELECT id FROM users WHERE outlet_id = ?)'
    )
    params.push(user.outletId || '')
  } else if (user?.role === 'regional_supervisor') {
    conditions.push(
      'a.user_id IN (SELECT id FROM users WHERE region_id = ?)'
    )
    params.push(user.regionId || '')
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  }
}

function buildLoginLogQuery(user: Express.Request['user']): { where: string; params: unknown[] } {
  const conditions: string[] = []
  const params: unknown[] = []

  if (user?.role === 'regional_supervisor') {
    conditions.push(
      'l.user_id IN (SELECT id FROM users WHERE region_id = ?)'
    )
    params.push(user.regionId || '')
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  }
}

router.get(
  '/logs',
  authMiddleware,
  requireAnyPermission(['audit:read:outlet', 'audit:read:region', 'audit:read:all']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const operationType = req.query.operationType as string | undefined
      const startDate = req.query.startDate as string | undefined
      const endDate = req.query.endDate as string | undefined

      const { where, params } = buildAuditQuery(req.user)
      const conditions: string[] = []
      const allParams = [...params]

      if (operationType) {
        conditions.push('a.operation_type = ?')
        allParams.push(operationType)
      }
      if (startDate) {
        conditions.push('a.created_at >= ?')
        allParams.push(startDate)
      }
      if (endDate) {
        conditions.push('a.created_at <= ?')
        allParams.push(endDate)
      }

      let fullWhere = where
      if (conditions.length > 0) {
        fullWhere = where
          ? where + ' AND ' + conditions.join(' AND ')
          : 'WHERE ' + conditions.join(' AND ')
      }

      const countQuery = `SELECT COUNT(*) as count FROM audit_logs a ${fullWhere}`
      const countResult = db.prepare(countQuery).get(...allParams) as { count: number }
      const total = countResult.count

      const offset = (page - 1) * pageSize
      const query = `
        SELECT a.*, u.username, u.real_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ${fullWhere}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `
      const logs = db.prepare(query).all(...allParams, pageSize, offset) as Array<
        AuditLog & { username?: string; real_name?: string }
      >

      const formattedLogs = logs.map((log) => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        realName: log.real_name,
        operationType: log.operation_type,
        operationDesc: log.operation_desc,
        detail: log.detail_json ? JSON.parse(log.detail_json) : undefined,
        ip: log.ip,
        userAgent: log.user_agent,
        createdAt: log.created_at,
      }))

      const response: ApiResponse<PaginatedResponse<typeof formattedLogs[0]>> = {
        success: true,
        data: {
          list: formattedLogs,
          total,
          page,
          pageSize,
        },
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Audit Logs Error]', error)
      res.status(500).json({
        success: false,
        error: '查询操作日志失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.get(
  '/login-logs',
  authMiddleware,
  requireAnyPermission(['audit:login:read:region', 'audit:login:read:all']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20
      const status = req.query.status as string | undefined
      const startDate = req.query.startDate as string | undefined
      const endDate = req.query.endDate as string | undefined

      const { where, params } = buildLoginLogQuery(req.user)
      const conditions: string[] = []
      const allParams = [...params]

      if (status) {
        conditions.push('l.status = ?')
        allParams.push(status)
      }
      if (startDate) {
        conditions.push('l.created_at >= ?')
        allParams.push(startDate)
      }
      if (endDate) {
        conditions.push('l.created_at <= ?')
        allParams.push(endDate)
      }

      let fullWhere = where
      if (conditions.length > 0) {
        fullWhere = where
          ? where + ' AND ' + conditions.join(' AND ')
          : 'WHERE ' + conditions.join(' AND ')
      }

      const countQuery = `SELECT COUNT(*) as count FROM login_logs l ${fullWhere}`
      const countResult = db.prepare(countQuery).get(...allParams) as { count: number }
      const total = countResult.count

      const offset = (page - 1) * pageSize
      const query = `
        SELECT l.*, u.real_name
        FROM login_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ${fullWhere}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `
      const logs = db.prepare(query).all(...allParams, pageSize, offset) as Array<
        LoginLog & { real_name?: string }
      >

      const formattedLogs = logs.map((log) => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        realName: log.real_name,
        status: log.status,
        ip: log.ip,
        location: log.location,
        device: log.device,
        failReason: log.fail_reason,
        createdAt: log.created_at,
      }))

      const response: ApiResponse<PaginatedResponse<typeof formattedLogs[0]>> = {
        success: true,
        data: {
          list: formattedLogs,
          total,
          page,
          pageSize,
        },
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Login Logs Error]', error)
      res.status(500).json({
        success: false,
        error: '查询登录日志失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

export default router
