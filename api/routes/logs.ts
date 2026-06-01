// @ts-nocheck
import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { module, action, user_name, target_id, start_time, end_time, page = 1, pageSize = 20 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (module) {
      whereClause += ' AND ol.module = ?'
      params.push(module as string)
    }

    if (action) {
      whereClause += ' AND ol.action = ?'
      params.push(action as string)
    }

    if (user_name) {
      whereClause += ' AND ol.user_name LIKE ?'
      params.push(`%${user_name}%`)
    }

    if (target_id) {
      whereClause += ' AND ol.target_id = ?'
      params.push(Number(target_id))
    }

    if (start_time) {
      whereClause += ' AND ol.created_at >= ?'
      params.push(start_time as string)
    }

    if (end_time) {
      whereClause += ' AND ol.created_at <= ?'
      params.push(end_time as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM operation_logs ol ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT ol.* FROM operation_logs ol
      ${whereClause}
      ORDER BY ol.created_at DESC
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
    console.error('Get logs error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取日志列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT * FROM operation_logs WHERE id = ?
    `)
    const log = stmt.get(Number(id) as any)

    if (!log) {
      res.status(404).json({
        success: false,
        message: '日志不存在',
      })
      return
    }

    res.json({
      success: true,
      data: log,
    })
  } catch (error) {
    console.error('Get log error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取日志详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      user_id, user_name, module, action,
      target_id, details, ip_address
    } = req.body

    if (!module || !action) {
      res.status(400).json({
        success: false,
        message: '模块、操作为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO operation_logs 
      (user_id, user_name, module, action, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = insertStmt.run(
      user_id || null,
      user_name || '',
      module,
      action,
      target_id ? Number(target_id) : null,
      details || '',
      ip_address || getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '创建日志成功',
    })
  } catch (error) {
    console.error('Create log error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '创建日志失败',
    })
  }
})

router.get('/modules/list', (req: Request, res: Response): void => {
  try {
    const stmt = db.prepare(`
      SELECT DISTINCT module FROM operation_logs ORDER BY module
    `)
    const modules = stmt.all().map((m: any) => m.module)

    res.json({
      success: true,
      data: modules,
    })
  } catch (error) {
    console.error('Get modules error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取模块列表失败',
    })
  }
})

router.get('/actions/list', (req: Request, res: Response): void => {
  try {
    const stmt = db.prepare(`
      SELECT DISTINCT action FROM operation_logs ORDER BY action
    `)
    const actions = stmt.all().map((a: any) => a.action)

    res.json({
      success: true,
      data: actions,
    })
  } catch (error) {
    console.error('Get actions error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取操作列表失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM operation_logs WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '日志不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM operation_logs WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    const insertLog = db.prepare(`
      INSERT INTO operation_logs (user_name, module, action, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertLog.run(
      (user_name as string) || '系统',
      '操作日志',
      '删除',
      Number(id),
      `删除日志: ${existing.module} - ${existing.action}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除日志成功',
    })
  } catch (error) {
    console.error('Delete log error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除日志失败',
    })
  }
})

export default router
