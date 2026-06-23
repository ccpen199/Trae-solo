import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireAnyPermission } from '../middleware/permission.js'
import { encryptAES256, decryptAES256 } from '../utils/encryption.js'
import type {
  ApiResponse,
  PaginatedResponse,
  RegulatoryOrder,
  OrderStatus,
  OrderPriority,
} from '../../shared/types.js'

const router = Router()

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function buildOrderQuery(user: Express.Request['user']): { where: string; params: unknown[] } {
  const conditions: string[] = []
  const params: unknown[] = []

  if (user?.role === 'courier' || user?.role === 'outlet_admin') {
    if (user.outletId) {
      conditions.push(
        "EXISTS (SELECT 1 FROM json_each(o.target_outlet_ids) WHERE json_each.value = ?)"
      )
      params.push(user.outletId)
    }
  } else if (user?.role === 'regional_supervisor') {
    conditions.push(
      "EXISTS (SELECT 1 FROM outlets outl WHERE outl.region_id = ? AND EXISTS (SELECT 1 FROM json_each(o.target_outlet_ids) WHERE json_each.value = outl.id))"
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
    'order:read:self',
    'order:read:outlet',
    'order:read:region',
    'order:read:all',
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 10
      const status = req.query.status as OrderStatus | undefined
      const priority = req.query.priority as OrderPriority | undefined

      const { where, params } = buildOrderQuery(req.user)
      const conditions: string[] = []
      const allParams = [...params]

      if (status) {
        conditions.push('o.status = ?')
        allParams.push(status)
      }
      if (priority) {
        conditions.push('o.priority = ?')
        allParams.push(priority)
      }

      let fullWhere = where
      if (conditions.length > 0) {
        fullWhere = where
          ? where + ' AND ' + conditions.join(' AND ')
          : 'WHERE ' + conditions.join(' AND ')
      }

      const countQuery = `SELECT COUNT(*) as count FROM regulatory_orders o ${fullWhere}`
      const countResult = db.prepare(countQuery).get(...allParams) as { count: number }
      const total = countResult.count

      const offset = (page - 1) * pageSize
      const query = `
        SELECT o.*, u.real_name as issuer_name
        FROM regulatory_orders o
        LEFT JOIN users u ON o.issuer_id = u.id
        ${fullWhere}
        ORDER BY
          CASE o.priority WHEN 'urgent' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
          o.deadline ASC,
          o.created_at DESC
        LIMIT ? OFFSET ?
      `
      const orders = db.prepare(query).all(...allParams, pageSize, offset) as Array<
        RegulatoryOrder & { issuer_name?: string }
      >

      const formattedOrders = orders.map((order) => {
        let targetOutletIds: string[] = []
        try {
          targetOutletIds = JSON.parse(order.target_outlet_ids) as string[]
        } catch {
          // ignore parse error
        }

        return {
          id: order.id,
          title: order.title,
          content: order.content,
          priority: order.priority,
          status: order.status,
          deadline: order.deadline,
          issuerId: order.issuer_id,
          issuerName: order.issuer_name,
          targetOutletIds,
          feedbackContent: order.feedback_content_enc
            ? decryptAES256(order.feedback_content_enc)
            : undefined,
          feedbackAttachments: order.feedback_attachments,
          feedbackSubmittedAt: order.feedback_submitted_at,
          createdAt: order.created_at,
        }
      })

      const response: ApiResponse<PaginatedResponse<typeof formattedOrders[0]>> = {
        success: true,
        data: {
          list: formattedOrders,
          total,
          page,
          pageSize,
        },
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Order List Error]', error)
      res.status(500).json({
        success: false,
        error: '查询监管指令列表失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.post(
  '/:id/feedback',
  authMiddleware,
  requireAnyPermission(['order:feedback']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { content, attachments } = req.body as {
        content: string
        attachments?: string
      }

      if (!content) {
        res.status(400).json({
          success: false,
          error: '反馈内容不能为空',
        } as ApiResponse)
        return
      }

      const existing = db
        .prepare('SELECT * FROM regulatory_orders WHERE id = ?')
        .get(id) as RegulatoryOrder | undefined

      if (!existing) {
        res.status(404).json({
          success: false,
          error: '监管指令不存在',
        } as ApiResponse)
        return
      }

      if (req.user?.role === 'outlet_admin') {
        let targetOutletIds: string[] = []
        try {
          targetOutletIds = JSON.parse(existing.target_outlet_ids) as string[]
        } catch {
          // ignore parse error
        }
        if (!targetOutletIds.includes(req.user.outletId || '')) {
          res.status(403).json({
            success: false,
            error: '无权对该指令提交反馈',
          } as ApiResponse)
          return
        }
      }

      const now = new Date().toISOString()
      db.prepare(
        `UPDATE regulatory_orders SET
          status = 'submitted',
          feedback_content_enc = ?,
          feedback_attachments = ?,
          feedback_submitted_at = ?
        WHERE id = ?`
      ).run(encryptAES256(content), attachments || null, now, id)

      if (req.user) {
        db.prepare(
          'INSERT INTO audit_logs (id, user_id, operation_type, operation_desc, detail_json, ip) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          generateId(),
          req.user.userId,
          'order_feedback',
          '提交监管指令执行反馈',
          JSON.stringify({ orderId: id }),
          req.ip
        )
      }

      const response: ApiResponse = {
        success: true,
        message: '执行反馈提交成功',
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Order Feedback Error]', error)
      res.status(500).json({
        success: false,
        error: '提交执行反馈失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

export default router
