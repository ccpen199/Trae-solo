// @ts-nocheck
import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
}

function createLog(
  user_name: string,
  module: string,
  action: string,
  target_id: number | null,
  details: string,
  ip_address: string
): void {
  const insertLog = db.prepare(`
    INSERT INTO operation_logs (user_name, module, action, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertLog.run(user_name, module, action, target_id, details, ip_address)
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { crop_type_id, zone_id, season, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (crop_type_id) {
      whereClause += ' AND wq.crop_type_id = ?'
      params.push(Number(crop_type_id))
    }

    if (zone_id) {
      whereClause += ' AND wq.zone_id = ?'
      params.push(Number(zone_id))
    }

    if (season) {
      whereClause += ' AND wq.season = ?'
      params.push(season as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM water_quotas wq ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT wq.*, ct.name as crop_name, ct.code as crop_code,
             fz.name as zone_name, fz.code as zone_code
      FROM water_quotas wq
      LEFT JOIN crop_types ct ON wq.crop_type_id = ct.id
      LEFT JOIN farm_zones fz ON wq.zone_id = fz.id
      ${whereClause}
      ORDER BY wq.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const list = listStmt.all(...params, Number(pageSize), offset)

    res.json({
      success: true,
      data: {
        list,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error) {
    console.error('Get quotas error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取配额列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT wq.*, ct.name as crop_name, ct.code as crop_code,
             fz.name as zone_name, fz.code as zone_code
      FROM water_quotas wq
      LEFT JOIN crop_types ct ON wq.crop_type_id = ct.id
      LEFT JOIN farm_zones fz ON wq.zone_id = fz.id
      WHERE wq.id = ?
    `)
    const quota = stmt.get(Number(id) as any)

    if (!quota) {
      res.status(404).json({
        success: false,
        message: '配额不存在',
      })
      return
    }

    res.json({
      success: true,
      data: quota,
    })
  } catch (error) {
    console.error('Get quota error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取配额详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { crop_type_id, zone_id, season, quota_per_acre, effective_date, description, user_name } = req.body

    if (!crop_type_id || !zone_id || !season || !quota_per_acre || !effective_date) {
      res.status(400).json({
        success: false,
        message: '作物、灌区、季节、每亩配额、生效日期为必填项',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM water_quotas 
      WHERE crop_type_id = ? AND zone_id = ? AND season = ? AND effective_date = ?
    `)
    const existing = checkStmt.get(Number(crop_type_id) as any, Number(zone_id), season, effective_date)
    if (existing) {
      res.status(400).json({
        success: false,
        message: '该作物、灌区、季节和生效日期的配额已存在',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO water_quotas (crop_type_id, zone_id, season, quota_per_acre, effective_date, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      Number(crop_type_id),
      Number(zone_id),
      season,
      Number(quota_per_acre),
      effective_date,
      description || ''
    )

    createLog(
      user_name || '系统',
      '配额管理',
      '新增',
      Number(result.lastInsertRowid),
      `新增配额: ${season} - 每亩${quota_per_acre}立方米`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增配额成功',
    })
  } catch (error) {
    console.error('Create quota error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增配额失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { crop_type_id, zone_id, season, quota_per_acre, effective_date, description, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM water_quotas WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '配额不存在',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM water_quotas 
      WHERE crop_type_id = ? AND zone_id = ? AND season = ? AND effective_date = ? AND id != ?
    `)
    const duplicate = checkStmt.get(
      Number(crop_type_id) as any || existing.crop_type_id,
      Number(zone_id) || existing.zone_id,
      season || existing.season,
      effective_date || existing.effective_date,
      Number(id)
    )
    if (duplicate) {
      res.status(400).json({
        success: false,
        message: '该作物、灌区、季节和生效日期的配额已存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE water_quotas
      SET crop_type_id = ?, zone_id = ?, season = ?, quota_per_acre = ?, effective_date = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      Number(crop_type_id) || existing.crop_type_id,
      Number(zone_id) || existing.zone_id,
      season || existing.season,
      Number(quota_per_acre) || existing.quota_per_acre,
      effective_date || existing.effective_date,
      description !== undefined ? description : existing.description,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '配额管理',
      '更新',
      Number(id),
      `更新配额: ${season || existing.season} - 每亩${quota_per_acre || existing.quota_per_acre}立方米`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新配额成功',
    })
  } catch (error) {
    console.error('Update quota error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新配额失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM water_quotas WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '配额不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM water_quotas WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '配额管理',
      '删除',
      Number(id),
      `删除配额: ${existing.season} - 每亩${existing.quota_per_acre}立方米`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除配额成功',
    })
  } catch (error) {
    console.error('Delete quota error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除配额失败',
    })
  }
})

export default router
