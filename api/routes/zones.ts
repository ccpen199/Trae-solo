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
    const { canal_id, crop_type_id, soil_type, keyword, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (canal_id) {
      whereClause += ' AND fz.canal_id = ?'
      params.push(Number(canal_id))
    }

    if (crop_type_id) {
      whereClause += ' AND fz.crop_type_id = ?'
      params.push(Number(crop_type_id))
    }

    if (soil_type) {
      whereClause += ' AND fz.soil_type = ?'
      params.push(soil_type as string)
    }

    if (keyword) {
      whereClause += ' AND (fz.name LIKE ? OR fz.code LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM farm_zones fz ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT fz.*, cs.name as canal_name, cs.code as canal_code,
             ct.name as crop_name, ct.code as crop_code
      FROM farm_zones fz
      LEFT JOIN canal_systems cs ON fz.canal_id = cs.id
      LEFT JOIN crop_types ct ON fz.crop_type_id = ct.id
      ${whereClause}
      ORDER BY fz.created_at DESC
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
    console.error('Get zones error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取灌区列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT fz.*, cs.name as canal_name, cs.code as canal_code,
             ct.name as crop_name, ct.code as crop_code
      FROM farm_zones fz
      LEFT JOIN canal_systems cs ON fz.canal_id = cs.id
      LEFT JOIN crop_types ct ON fz.crop_type_id = ct.id
      WHERE fz.id = ?
    `)
    const zone = stmt.get(Number(id) as any)

    if (!zone) {
      res.status(404).json({
        success: false,
        message: '灌区不存在',
      })
      return
    }

    res.json({
      success: true,
      data: zone,
    })
  } catch (error) {
    console.error('Get zone error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取灌区详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, code, area, crop_type_id, canal_id, soil_type, location, description, user_name } = req.body

    if (!name || !code || !area) {
      res.status(400).json({
        success: false,
        message: '名称、编码、面积为必填项',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM farm_zones WHERE name = ? OR code = ?
    `)
    const existing = checkStmt.get(name, code) as any
    if (existing) {
      res.status(400).json({
        success: false,
        message: '灌区名称或编码已存在',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO farm_zones (name, code, area, crop_type_id, canal_id, soil_type, location, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      name,
      code,
      Number(area),
      crop_type_id ? Number(crop_type_id) : null,
      canal_id ? Number(canal_id) : null,
      soil_type || '',
      location || '',
      description || ''
    )

    createLog(
      user_name || '系统',
      '灌区管理',
      '新增',
      Number(result.lastInsertRowid),
      `新增灌区: ${name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增灌区成功',
    })
  } catch (error) {
    console.error('Create zone error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增灌区失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, code, area, crop_type_id, canal_id, soil_type, location, description, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM farm_zones WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '灌区不存在',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM farm_zones WHERE (name = ? OR code = ?) AND id != ?
    `)
    const duplicate = checkStmt.get(name, code, Number(id) as any)
    if (duplicate) {
      res.status(400).json({
        success: false,
        message: '灌区名称或编码已存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE farm_zones
      SET name = ?, code = ?, area = ?, crop_type_id = ?, canal_id = ?, soil_type = ?, location = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      name || existing.name,
      code || existing.code,
      Number(area) || existing.area,
      crop_type_id !== undefined ? Number(crop_type_id) : existing.crop_type_id,
      canal_id !== undefined ? Number(canal_id) : existing.canal_id,
      soil_type !== undefined ? soil_type : existing.soil_type,
      location !== undefined ? location : existing.location,
      description !== undefined ? description : existing.description,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '灌区管理',
      '更新',
      Number(id),
      `更新灌区: ${name || existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新灌区成功',
    })
  } catch (error) {
    console.error('Update zone error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新灌区失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM farm_zones WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '灌区不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM farm_zones WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '灌区管理',
      '删除',
      Number(id),
      `删除灌区: ${existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除灌区成功',
    })
  } catch (error) {
    console.error('Delete zone error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除灌区失败',
    })
  }
})

export default router
