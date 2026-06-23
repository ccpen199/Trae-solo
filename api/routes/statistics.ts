import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireAnyPermission } from '../middleware/permission.js'
import type { ApiResponse } from '../../shared/types.js'

const router = Router()

function buildScopeQuery(
  user: Express.Request['user'],
  tableAlias: string
): { where: string; params: unknown[] } {
  const conditions: string[] = []
  const params: unknown[] = []

  if (user?.role === 'courier') {
    conditions.push(`${tableAlias}.courier_id = ?`)
    params.push(user.userId)
  } else if (user?.role === 'outlet_admin') {
    conditions.push(`${tableAlias}.outlet_id = ?`)
    params.push(user.outletId || '')
  } else if (user?.role === 'regional_supervisor') {
    conditions.push(
      `${tableAlias}.outlet_id IN (SELECT id FROM outlets WHERE region_id = ?)`
    )
    params.push(user.regionId || '')
  }

  return { where: conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '', params }
}

function buildExceptionScopeQuery(
  user: Express.Request['user']
): { where: string; params: unknown[] } {
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

  return { where: conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '', params }
}

router.get(
  '/overview',
  authMiddleware,
  requireAnyPermission([
    'statistics:read:outlet',
    'statistics:read:region',
    'statistics:read:all',
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = buildScopeQuery(req.user, 'w')
      const exScope = buildExceptionScopeQuery(req.user)

      const totalWaybills = db
        .prepare(`SELECT COUNT(*) as count FROM waybills w WHERE 1=1 ${scope.where}`)
        .get(...scope.params) as { count: number }

      const syncedWaybills = db
        .prepare(
          `SELECT COUNT(*) as count FROM waybills w WHERE status = 'synced' ${scope.where}`
        )
        .get(...scope.params) as { count: number }

      const pendingSyncWaybills = db
        .prepare(
          `SELECT COUNT(*) as count FROM waybills w WHERE status = 'pending_sync' ${scope.where}`
        )
        .get(...scope.params) as { count: number }

      const pendingExceptions = db
        .prepare(
          `SELECT COUNT(*) as count FROM exception_records e WHERE status = 'pending' ${exScope.where}`
        )
        .get(...exScope.params) as { count: number }

      const reviewingExceptions = db
        .prepare(
          `SELECT COUNT(*) as count FROM exception_records e WHERE status = 'reviewing' ${exScope.where}`
        )
        .get(...exScope.params) as { count: number }

      const totalUsers = db
        .prepare(
          `SELECT COUNT(*) as count FROM users u WHERE status = 'active' ${
            req.user?.role === 'outlet_admin'
              ? "AND outlet_id = '" + (req.user.outletId || '') + "'"
              : req.user?.role === 'regional_supervisor'
              ? "AND region_id = '" + (req.user.regionId || '') + "'"
              : ''
          }`
        )
        .get() as { count: number }

      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const todayWaybills = db
        .prepare(
          `SELECT COUNT(*) as count FROM waybills w WHERE created_at >= ? ${scope.where}`
        )
        .get(startOfDay, ...scope.params) as { count: number }

      const pendingOrdersScope =
        req.user?.role === 'outlet_admin'
          ? "AND EXISTS (SELECT 1 FROM json_each(regulatory_orders.target_outlet_ids) WHERE json_each.value = '" +
            (req.user.outletId || '') +
            "')"
          : req.user?.role === 'regional_supervisor'
          ? "AND EXISTS (SELECT 1 FROM outlets outl WHERE outl.region_id = '" +
            (req.user.regionId || '') +
            "' AND EXISTS (SELECT 1 FROM json_each(regulatory_orders.target_outlet_ids) WHERE json_each.value = outl.id))"
          : ''

      const pendingOrders = db
        .prepare(
          `SELECT COUNT(*) as count FROM regulatory_orders WHERE status IN ('pending', 'executing') ${pendingOrdersScope}`
        )
        .get() as { count: number }

      const data = {
        totalWaybills: totalWaybills.count,
        syncedWaybills: syncedWaybills.count,
        pendingSyncWaybills: pendingSyncWaybills.count,
        pendingExceptions: pendingExceptions.count,
        reviewingExceptions: reviewingExceptions.count,
        totalActiveUsers: totalUsers.count,
        todayWaybills: todayWaybills.count,
        pendingOrders: pendingOrders.count,
        syncRate:
          totalWaybills.count > 0
            ? Math.round((syncedWaybills.count / totalWaybills.count) * 10000) / 100
            : 0,
      }

      const response: ApiResponse<typeof data> = {
        success: true,
        data,
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Statistics Overview Error]', error)
      res.status(500).json({
        success: false,
        error: '获取概览统计失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.get(
  '/shipment-trend',
  authMiddleware,
  requireAnyPermission([
    'statistics:read:outlet',
    'statistics:read:region',
    'statistics:read:all',
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 7
      const scope = buildScopeQuery(req.user, 'w')

      const results: Array<{ date: string; count: number }> = []

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        const nextDateStr = nextDate.toISOString().split('T')[0]

        const row = db
          .prepare(
            `SELECT COUNT(*) as count FROM waybills w WHERE created_at >= ? AND created_at < ? ${scope.where}`
          )
          .get(dateStr, nextDateStr, ...scope.params) as { count: number }

        results.push({
          date: dateStr,
          count: row.count,
        })
      }

      const data = {
        days,
        trend: results,
      }

      const response: ApiResponse<typeof data> = {
        success: true,
        data,
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Statistics Shipment Trend Error]', error)
      res.status(500).json({
        success: false,
        error: '获取收寄趋势统计失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

router.get(
  '/exception-distribution',
  authMiddleware,
  requireAnyPermission([
    'statistics:read:outlet',
    'statistics:read:region',
    'statistics:read:all',
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = buildExceptionScopeQuery(req.user)

      const typeQuery = `
        SELECT type, COUNT(*) as count
        FROM exception_records e
        WHERE 1=1 ${scope.where}
        GROUP BY type
      `
      const typeResults = db.prepare(typeQuery).all(...scope.params) as Array<{
        type: string
        count: number
      }>

      const statusQuery = `
        SELECT status, COUNT(*) as count
        FROM exception_records e
        WHERE 1=1 ${scope.where}
        GROUP BY status
      `
      const statusResults = db.prepare(statusQuery).all(...scope.params) as Array<{
        status: string
        count: number
      }>

      const priorityQuery = `
        SELECT priority, COUNT(*) as count
        FROM exception_records e
        WHERE 1=1 ${scope.where}
        GROUP BY priority
      `
      const priorityResults = db.prepare(priorityQuery).all(...scope.params) as Array<{
        priority: string
        count: number
      }>

      const totalCount = typeResults.reduce((sum, t) => sum + t.count, 0)

      const data = {
        total: totalCount,
        byType: typeResults.map((r) => ({ type: r.type, count: r.count })),
        byStatus: statusResults.map((r) => ({ status: r.status, count: r.count })),
        byPriority: priorityResults.map((r) => ({ priority: r.priority, count: r.count })),
      }

      const response: ApiResponse<typeof data> = {
        success: true,
        data,
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('[Statistics Exception Distribution Error]', error)
      res.status(500).json({
        success: false,
        error: '获取异常分布统计失败，服务器内部错误',
      } as ApiResponse)
    }
  }
)

export default router
