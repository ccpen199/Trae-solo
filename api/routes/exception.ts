import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireAnyPermission } from '../middleware/permission.js'
import type {
  ApiResponse,
  PaginatedResponse,
  ExceptionRecord,
  ExceptionType,
  ExceptionStatus,
  ExceptionPriority,
} from '../../shared/types.js'

const router = Router()

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function buildExceptionQuery(user: Express.Request['user']): { where: string; params: unknown[] } {
  const conditions: string[] = []
  const params: unknown[] = []

  if (user?.role === 'outlet_admin') {
    conditions.push(
      'e.waybill_id IN (SELECT id FROM waybills WHERE outlet_id = ?)'
    )
    params.push(user.outletId || '')
  } else if (user?.role === 'regional_supervisor') {
    conditions.push(
      'e.waybill_id IN (SELECT w.id FROM waybills w JOIN outlets o ON w.outlet_id = o.id WHERE o.region_id = ?)'
    )
    params.push(user.regionId || '')
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  }
}

router.get(
  '/',
  authMiddleware,
  requireAnyPermission([
    'exception:list:outlet',
    'exception:list:region',
    'exception:list:all',
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 10
      const status = req.query.status as ExceptionStatus | undefined
      const type = req.query.type as ExceptionType | undefined
      const priority = req.query.priority as ExceptionPriority | undefined

      const { where, params } = buildExceptionQuery(req.user)
      const conditions: string[] = []
      const allParams = [...params]

      if (status) {
        conditions.push('e.status = ?')
        allParams.push(status)
      }
      if (type) {
        conditions.push('e.type = ?')
        allParams.push(type)
      }
      if (priority) {
        conditions.push('e.priority = ?')
        allParams.push(priority)
      }

      let fullWhere = where
      if (conditions.length > 0) {
        fullWhere = where
          ? where + ' AND ' + conditions.join(' AND ')
          : 'WHERE ' + conditions.join(' AND ')
      }

      const countQuery = `SELECT COUNT(*) as count FROM exception_records e ${fullWhere}`
      const countResult = db.prepare(countQuery).get(...allParams) as { count: number }
      const total = countResult.count

      const offset = (page - 1) * pageSize
      const query = `
        SELECT e.*, w.tracking_no, u.real_name as handler_name
        FROM exception_records e
        LEFT JOIN waybills w ON e.waybill_id = w.id
        LEFT JOIN users u ON e.handler_id = u.id
        ${fullWhere}
        ORDER BY
          CASE e.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
          e.created_at DESC
        LIMIT ? OFFSET ?
      `
      const exceptions = db.prepare(query).all(...allParams, pageSize, offset) as Array<
        ExceptionRecord & { tracking_no?: string; handler_name?: string }
      >

      const formattedExceptions = exceptions.map((ex) => ({
        id: ex.id,
        waybillId: ex.waybill_id,
        trackingNo: ex.tracking_no,
        type: ex.type,
        status: ex.status,
        priority: ex.priority,
        description: ex.description,
        handlerId: ex.handler_id,
        handlerName: ex.handler_name,
        reviewNote: ex.review_note,
        createdAt: ex.created_at,
        reviewedAt: ex.reviewed_at,
      }))

      const response: ApiResponse<PaginatedResponse<typeof formattedExceptions[0]>> = {
        success: true,
        data: {
          list: formattedExceptions,
          total,
          page,
          pageSize,
        },
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Exception List Error]', error)
      res.status(500).json({
        success: false,
        error: '查询异常件列表失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.post(
  '/:id/review',
  authMiddleware,
  requireAnyPermission(['exception:review']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { status, reviewNote } = req.body as {
        status?: ExceptionStatus
        reviewNote?: string
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: '复核状态不能为空',
        } as ApiResponse)
        return
      }

      if (!['resolved', 'rejected', 'reviewing'].includes(status)) {
        res.status(400).json({
          success: false,
          error: '无效的复核状态',
        } as ApiResponse)
        return
      }

      const existing = db
        .prepare('SELECT * FROM exception_records WHERE id = ?')
        .get(id) as ExceptionRecord | undefined

      if (!existing) {
        res.status(404).json({
          success: false,
          error: '异常记录不存在',
        } as ApiResponse)
        return
      }

      if (req.user?.role === 'outlet_admin') {
        const waybill = db
          .prepare('SELECT outlet_id FROM waybills WHERE id = ?')
          .get(existing.waybill_id) as { outlet_id?: string } | undefined
        if (waybill?.outlet_id !== req.user.outletId) {
          res.status(403).json({
            success: false,
            error: '无权复核该异常件',
          } as ApiResponse)
          return
        }
      }

      const now = new Date().toISOString()
      db.prepare(
        'UPDATE exception_records SET status = ?, handler_id = ?, review_note = ?, reviewed_at = ? WHERE id = ?'
      ).run(status, req.user?.userId, reviewNote || null, now, id)

      if (req.user) {
        db.prepare(
          'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, detail_json, ip) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          generateId(),
          req.user.userId,
          'exception_review',
          '复核异常件',
          JSON.stringify({ exceptionId: id, status, reviewNote }),
          req.ip
        )
      }

      const response: ApiResponse = {
        success: true,
        message: '异常件复核成功',
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Exception Review Error]', error)
      res.status(500).json({
        success: false,
        error: '复核异常件失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

export default router
