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
    const { status, device_type, device_id, alarm_type, alarm_level, start_time, end_time, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (status) {
      whereClause += ' AND a.status = ?'
      params.push(status as string)
    }

    if (device_type) {
      whereClause += ' AND a.device_type = ?'
      params.push(device_type as string)
    }

    if (device_id) {
      whereClause += ' AND a.device_id = ?'
      params.push(Number(device_id))
    }

    if (alarm_type) {
      whereClause += ' AND a.alarm_type = ?'
      params.push(alarm_type as string)
    }

    if (alarm_level) {
      whereClause += ' AND a.alarm_level = ?'
      params.push(alarm_level as string)
    }

    if (start_time) {
      whereClause += ' AND a.created_at >= ?'
      params.push(start_time as string)
    }

    if (end_time) {
      whereClause += ' AND a.created_at <= ?'
      params.push(end_time as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM alarms a ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT a.* FROM alarms a
      ${whereClause}
      ORDER BY a.created_at DESC
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
    console.error('Get alarms error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取告警列表失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT a.* FROM alarms a
      WHERE a.id = ?
    `)
    const alarm = stmt.get(Number(id) as any)

    if (!alarm) {
      res.status(404).json({
        success: false,
        message: '告警不存在',
      })
      return
    }

    res.json({
      success: true,
      data: alarm,
    })
  } catch (error) {
    console.error('Get alarm error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取告警详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      device_type, device_id, device_code, alarm_type,
      alarm_level, alarm_message, user_name
    } = req.body

    if (!device_type || !device_id || !device_code || !alarm_type || !alarm_level || !alarm_message) {
      res.status(400).json({
        success: false,
        message: '设备类型、设备ID、设备编码、告警类型、告警级别、告警信息为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO alarms 
      (device_type, device_id, device_code, alarm_type, alarm_level, alarm_message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = insertStmt.run(
      device_type,
      Number(device_id),
      device_code,
      alarm_type,
      alarm_level,
      alarm_message,
      'active'
    )

    createLog(
      user_name || '系统',
      '告警管理',
      '产生',
      Number(result.lastInsertRowid),
      `告警: ${device_code} - ${alarm_message}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '告警上报成功',
    })
  } catch (error) {
    console.error('Create alarm error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '告警上报失败',
    })
  }
})

router.post('/:id/acknowledge', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { acknowledged_by, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM alarms WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '告警不存在',
      })
      return
    }

    if (existing.status === 'resolved') {
      res.status(400).json({
        success: false,
        message: '已解决的告警无需确认',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE alarms
      SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(acknowledged_by || '', Number(id))

    createLog(
      user_name || acknowledged_by || '系统',
      '告警管理',
      '确认',
      Number(id),
      `确认告警: ${existing.device_code} - ${existing.alarm_message}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '告警已确认',
    })
  } catch (error) {
    console.error('Acknowledge alarm error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '确认告警失败',
    })
  }
})

router.post('/:id/resolve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { resolution, acknowledged_by, user_name } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM alarms WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '告警不存在',
      })
      return
    }

    if (existing.status === 'resolved') {
      res.status(400).json({
        success: false,
        message: '告警已解决',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE alarms
      SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolution = ?, acknowledged_by = COALESCE(?, acknowledged_by), acknowledged_at = COALESCE(CURRENT_TIMESTAMP, acknowledged_at)
      WHERE id = ?
    `)
    updateStmt.run(resolution || '', acknowledged_by || '', Number(id))

    createLog(
      user_name || acknowledged_by || '系统',
      '告警管理',
      '解决',
      Number(id),
      `解决告警: ${existing.device_code} - ${existing.alarm_message}, 措施: ${resolution}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '告警已解决',
    })
  } catch (error) {
    console.error('Resolve alarm error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '解决告警失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      device_type, device_id, device_code, alarm_type,
      alarm_level, alarm_message, status, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM alarms WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '告警不存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE alarms
      SET device_type = ?, device_id = ?, device_code = ?, alarm_type = ?, alarm_level = ?, alarm_message = ?, status = ?
      WHERE id = ?
    `)
    updateStmt.run(
      device_type || existing.device_type,
      Number(device_id) || existing.device_id,
      device_code || existing.device_code,
      alarm_type || existing.alarm_type,
      alarm_level || existing.alarm_level,
      alarm_message || existing.alarm_message,
      status || existing.status,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '告警管理',
      '更新',
      Number(id),
      `更新告警: ${device_code || existing.device_code}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新告警成功',
    })
  } catch (error) {
    console.error('Update alarm error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新告警失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM alarms WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '告警不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM alarms WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '告警管理',
      '删除',
      Number(id),
      `删除告警: ${existing.device_code} - ${existing.alarm_message}`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除告警成功',
    })
  } catch (error) {
    console.error('Delete alarm error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除告警失败',
    })
  }
})

export default router
