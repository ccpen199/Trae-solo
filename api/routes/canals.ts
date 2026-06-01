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
    const { status, keyword, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (status) {
      whereClause += ' AND status = ?'
      params.push(status as string)
    }

    if (keyword) {
      whereClause += ' AND (name LIKE ? OR code LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM canal_systems ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT * FROM canal_systems ${whereClause}
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
    console.error('Get canals error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取渠道列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT * FROM canal_systems WHERE id = ?
    `)
    const canal = stmt.get(Number(id) as any)

    if (!canal) {
      res.status(404).json({
        success: false,
        message: '渠道不存在',
      })
      return
    }

    res.json({
      success: true,
      data: canal,
    })
  } catch (error) {
    console.error('Get canal error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取渠道详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, code, length, capacity, status, description, user_name } = req.body

    if (!name || !code || !length || !capacity) {
      res.status(400).json({
        success: false,
        message: '名称、编码、长度、流量为必填项',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM canal_systems WHERE name = ? OR code = ?
    `)
    const existing = checkStmt.get(name, code) as any
    if (existing) {
      res.status(400).json({
        success: false,
        message: '渠道名称或编码已存在',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO canal_systems (name, code, length, capacity, status, description, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    const result = insertStmt.run(
      name,
      code,
      Number(length),
      Number(capacity),
      status || 'active',
      description || ''
    )

    createLog(
      user_name || '系统',
      '渠道管理',
      '新增',
      Number(result.lastInsertRowid),
      `新增渠道: ${name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '新增渠道成功',
    })
  } catch (error) {
    console.error('Create canal error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '新增渠道失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, code, length, capacity, status, description, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM canal_systems WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '渠道不存在',
      })
      return
    }

    const checkStmt = db.prepare(`
      SELECT id FROM canal_systems WHERE (name = ? OR code = ?) AND id != ?
    `)
    const duplicate = checkStmt.get(name, code, Number(id) as any)
    if (duplicate) {
      res.status(400).json({
        success: false,
        message: '渠道名称或编码已存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE canal_systems
      SET name = ?, code = ?, length = ?, capacity = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(
      name || existing.name,
      code || existing.code,
      Number(length) || existing.length,
      Number(capacity) || existing.capacity,
      status || existing.status,
      description !== undefined ? description : existing.description,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '渠道管理',
      '更新',
      Number(id),
      `更新渠道: ${name || existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新渠道成功',
    })
  } catch (error) {
    console.error('Update canal error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新渠道失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM canal_systems WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '渠道不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM canal_systems WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '渠道管理',
      '删除',
      Number(id),
      `删除渠道: ${existing.name}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除渠道成功',
    })
  } catch (error) {
    console.error('Delete canal error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除渠道失败',
    })
  }
})

export default router
