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
      whereClause += ' AND g.status = ?'
      params.push(status as string)
    }

    if (canal_id) {
      whereClause += ' AND g.canal_id = ?'
      params.push(Number(canal_id))
    }

    if (keyword) {
      whereClause += ' AND (g.name LIKE ? OR g.code LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM gates g ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT g.*, cs.name as canal_name, cs.code as canal_code
      FROM gates g
      LEFT JOIN canal_systems cs ON g.canal_id = cs.id
      ${whereClause}
      ORDER BY g.created_at DESC
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
    console.error('Get gates error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取闸门列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT g.*, cs.name as canal_name, cs.code as canal_code
      FROM gates g
      LEFT JOIN canal_systems cs ON g.canal_id = cs.id
      WHERE g.id = ?
    `)
    const gate = stmt.get(Number(id) as any)

    if (!gate) {
      res.status(404).json({
        success: false,
        message: '闸门不存在',
      })
      return
    }

    res.json({
      success: true,
      data: gate,
    })
  } catch (error) {
    console.error('Get gate error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取闸门详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, code, canal_id, max_opening, current_opening, status, location, description, user_name } = req.body

    if (!name || !code || !max_opening) {
      res.status(400).json({
        success: false,
        message: '名称、编码、最大开度为必填项',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM gates WHERE name = ? OR code = ?
    `)
    const existing = checkStmt.get(name, code) as any
    if (existing) {
      res.status(400).json({
        success: false,
        message: '闸门名称或编码已存在',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO gates (name, code, canal_id, max_opening, current_opening, status, location, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      name,
      code,
      canal_id ? Number(canal_id) : null,
      Number(max_opening),
      current_opening !== undefined ? Number(current_opening) : 0,
      status || 'normal',
      location || '',
      description || ''
    )

    createLog(
      user_name || '系统',
      '闸门管理',
      '新增',
      Number(result.lastInsertRowid),
      `新增闸门: ${name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增闸门成功',
    })
  } catch (error) {
    console.error('Create gate error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增闸门失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, code, canal_id, max_opening, current_opening, status, location, description, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM gates WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '闸门不存在',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM gates WHERE (name = ? OR code = ?) AND id != ?
    `)
    const duplicate = checkStmt.get(name, code, Number(id) as any)
    if (duplicate) {
      res.status(400).json({
        success: false,
        message: '闸门名称或编码已存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE gates
      SET name = ?, code = ?, canal_id = ?, max_opening = ?, current_opening = ?, status = ?, location = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      name || existing.name,
      code || existing.code,
      canal_id !== undefined ? Number(canal_id) : existing.canal_id,
      Number(max_opening) || existing.max_opening,
      current_opening !== undefined ? Number(current_opening) : existing.current_opening,
      status || existing.status,
      location !== undefined ? location : existing.location,
      description !== undefined ? description : existing.description,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '闸门管理',
      '更新',
      Number(id),
      `更新闸门: ${name || existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新闸门成功',
    })
  } catch (error) {
    console.error('Update gate error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新闸门失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM gates WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '闸门不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM gates WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '闸门管理',
      '删除',
      Number(id),
      `删除闸门: ${existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除闸门成功',
    })
  } catch (error) {
    console.error('Delete gate error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除闸门失败',
    })
  }
})

export default router
