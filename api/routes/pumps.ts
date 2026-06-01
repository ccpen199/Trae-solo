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
    const { status, canal_id, keyword, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (status) {
      whereClause += ' AND ps.status = ?'
      params.push(status as string)
    }

    if (canal_id) {
      whereClause += ' AND ps.canal_id = ?'
      params.push(Number(canal_id))
    }

    if (keyword) {
      whereClause += ' AND (ps.name LIKE ? OR ps.code LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM pump_stations ps ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT ps.*, cs.name as canal_name, cs.code as canal_code
      FROM pump_stations ps
      LEFT JOIN canal_systems cs ON ps.canal_id = cs.id
      ${whereClause}
      ORDER BY ps.created_at DESC
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
    console.error('Get pumps error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取泵站列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT ps.*, cs.name as canal_name, cs.code as canal_code
      FROM pump_stations ps
      LEFT JOIN canal_systems cs ON ps.canal_id = cs.id
      WHERE ps.id = ?
    `)
    const pump = stmt.get(Number(id) as any)

    if (!pump) {
      res.status(404).json({
        success: false,
        message: '泵站不存在',
      })
      return
    }

    res.json({
      success: true,
      data: pump,
    })
  } catch (error) {
    console.error('Get pump error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取泵站详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, code, canal_id, capacity, power, status, last_maintenance, description, user_name } = req.body

    if (!name || !code || !capacity || !power) {
      res.status(400).json({
        success: false,
        message: '名称、编码、流量、功率为必填项',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM pump_stations WHERE name = ? OR code = ?
    `)
    const existing = checkStmt.get(name, code) as any
    if (existing) {
      res.status(400).json({
        success: false,
        message: '泵站名称或编码已存在',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO pump_stations (name, code, canal_id, capacity, power, status, last_maintenance, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      name,
      code,
      canal_id ? Number(canal_id) : null,
      Number(capacity),
      Number(power),
      status || 'normal',
      last_maintenance || null,
      description || ''
    )

    createLog(
      user_name || '系统',
      '泵站管理',
      '新增',
      Number(result.lastInsertRowid),
      `新增泵站: ${name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增泵站成功',
    })
  } catch (error) {
    console.error('Create pump error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增泵站失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, code, canal_id, capacity, power, status, last_maintenance, description, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM pump_stations WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '泵站不存在',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM pump_stations WHERE (name = ? OR code = ?) AND id != ?
    `)
    const duplicate = checkStmt.get(name, code, Number(id) as any)
    if (duplicate) {
      res.status(400).json({
        success: false,
        message: '泵站名称或编码已存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE pump_stations
      SET name = ?, code = ?, canal_id = ?, capacity = ?, power = ?, status = ?, last_maintenance = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      name || existing.name,
      code || existing.code,
      canal_id !== undefined ? Number(canal_id) : existing.canal_id,
      Number(capacity) || existing.capacity,
      Number(power) || existing.power,
      status || existing.status,
      last_maintenance !== undefined ? last_maintenance : existing.last_maintenance,
      description !== undefined ? description : existing.description,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '泵站管理',
      '更新',
      Number(id),
      `更新泵站: ${name || existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新泵站成功',
    })
  } catch (error) {
    console.error('Update pump error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新泵站失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM pump_stations WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '泵站不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM pump_stations WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '泵站管理',
      '删除',
      Number(id),
      `删除泵站: ${existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除泵站成功',
    })
  } catch (error) {
    console.error('Delete pump error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除泵站失败',
    })
  }
})

export default router
