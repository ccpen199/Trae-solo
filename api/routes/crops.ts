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
    const { keyword, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (keyword) {
      whereClause += ' AND (name LIKE ? OR code LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM crop_types ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT * FROM crop_types ${whereClause}
      ORDER BY created_at DESC
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
    console.error('Get crops error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取作物列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT * FROM crop_types WHERE id = ?
    `)
    const crop = stmt.get(Number(id) as any)

    if (!crop) {
      res.status(404).json({
        success: false,
        message: '作物不存在',
      })
      return
    }

    res.json({
      success: true,
      data: crop,
    })
  } catch (error) {
    console.error('Get crop error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取作物详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, code, growth_cycle, water_quota, description, user_name } = req.body

    if (!name || !code || !growth_cycle || !water_quota) {
      res.status(400).json({
        success: false,
        message: '名称、编码、生长周期、用水定额为必填项',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM crop_types WHERE name = ? OR code = ?
    `)
    const existing = checkStmt.get(name, code) as any
    if (existing) {
      res.status(400).json({
        success: false,
        message: '作物名称或编码已存在',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO crop_types (name, code, growth_cycle, water_quota, description, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      name,
      code,
      Number(growth_cycle),
      Number(water_quota),
      description || ''
    )

    createLog(
      user_name || '系统',
      '作物管理',
      '新增',
      Number(result.lastInsertRowid),
      `新增加作物: ${name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增加作物成功',
    })
  } catch (error) {
    console.error('Create crop error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增加作物失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, code, growth_cycle, water_quota, description, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM crop_types WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '作物不存在',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM crop_types WHERE (name = ? OR code = ?) AND id != ?
    `)
    const duplicate = checkStmt.get(name, code, Number(id) as any)
    if (duplicate) {
      res.status(400).json({
        success: false,
        message: '作物名称或编码已存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE crop_types
      SET name = ?, code = ?, growth_cycle = ?, water_quota = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      name || existing.name,
      code || existing.code,
      Number(growth_cycle) || existing.growth_cycle,
      Number(water_quota) || existing.water_quota,
      description !== undefined ? description : existing.description,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '作物管理',
      '更新',
      Number(id),
      `更新作物: ${name || existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新作物成功',
    })
  } catch (error) {
    console.error('Update crop error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新作物失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM crop_types WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '作物不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM crop_types WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '作物管理',
      '删除',
      Number(id),
      `删除作物: ${existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除作物成功',
    })
  } catch (error) {
    console.error('Delete crop error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除作物失败',
    })
  }
})

export default router
