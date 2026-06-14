import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'
import { orgScope } from '../middleware/rbac.js'

const router = Router()

const ORG_PATH_CTE = `
  WITH RECURSIVE org_path_cte(id, name, parent_id, path) AS (
    SELECT id, name, parent_id, name
    FROM organizations
    WHERE parent_id IS NULL
    UNION ALL
    SELECT o.id, o.name, o.parent_id, opc.path || '/' || o.name
    FROM organizations o
    JOIN org_path_cte opc ON o.parent_id = opc.id
  )
`

router.get('/', authMiddleware, orgScope, (req: Request, res: Response): void => {
  try {
    const { orgId, status, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const orgScopeIds = (req as any).orgScopeIds as number[]
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (orgId) {
      where += ' AND v.org_id = ?'
      params.push(Number(orgId))
    } else if (orgScopeIds) {
      where += ` AND v.org_id IN (${orgScopeIds.map(() => '?').join(',')})`
      params.push(...orgScopeIds)
    }
    if (status && status !== 'all') {
      where += ' AND v.status = ?'
      params.push(status)
    }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM vehicles v ${where}`).get(...params) as any).count
    const list = db.prepare(
      `${ORG_PATH_CTE}
       SELECT v.*, d.name as driver_name, dev.sn as device_sn, dev.protocol as device_protocol,
              o.name as org_name, opc.path as org_path
       FROM vehicles v
       LEFT JOIN drivers d ON v.driver_id = d.id
       LEFT JOIN devices dev ON v.device_id = dev.id
       LEFT JOIN organizations o ON v.org_id = o.id
       LEFT JOIN org_path_cte opc ON v.org_id = opc.id
       ${where} ORDER BY v.id LIMIT ? OFFSET ?`,
    ).all(...params, ps, (p - 1) * ps)
    res.json({ success: true, data: { list, total } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const vehicle = db.prepare(
      `${ORG_PATH_CTE}
       SELECT v.*, d.name as driver_name, d.license_number, d.score as driver_score,
              dev.sn as device_sn, dev.protocol as device_protocol, dev.firmware_version, dev.status as device_status,
              o.name as org_name, opc.path as org_path
       FROM vehicles v
       LEFT JOIN drivers d ON v.driver_id = d.id
       LEFT JOIN devices dev ON v.device_id = dev.id
       LEFT JOIN organizations o ON v.org_id = o.id
       LEFT JOIN org_path_cte opc ON v.org_id = opc.id
       WHERE v.id = ?`,
    ).get(req.params.id) as any
    if (!vehicle) {
      res.status(404).json({ success: false, error: '车辆不存在' })
      return
    }
    res.json({ success: true, data: vehicle })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/:id/realtime', authMiddleware, (req: Request, res: Response): void => {
  try {
    const vehicle = db.prepare(
      'SELECT id, lat, lng, speed, heading, status, last_location_time as timestamp FROM vehicles WHERE id = ?',
    ).get(req.params.id) as any
    if (!vehicle) {
      res.status(404).json({ success: false, error: '车辆不存在' })
      return
    }
    res.json({ success: true, data: vehicle })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
