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
    const { device_type, device_id, status, start_time, end_time, page = 1, pageSize = 10 } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (device_type) {
      whereClause += ' AND ds.device_type = ?'
      params.push(device_type as string)
    }

    if (device_id) {
      whereClause += ' AND ds.device_id = ?'
      params.push(Number(device_id))
    }

    if (status) {
      whereClause += ' AND ds.status = ?'
      params.push(status as string)
    }

    if (start_time) {
      whereClause += ' AND ds.timestamp >= ?'
      params.push(start_time as string)
    }

    if (end_time) {
      whereClause += ' AND ds.timestamp <= ?'
      params.push(end_time as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM device_status ds ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT ds.* FROM device_status ds
      ${whereClause}
      ORDER BY ds.timestamp DESC
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
    console.error('Get device status error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取设备状态列表失败',
    })
  }
})

router.get('/latest', (req: Request, res: Response): void => {
  try {
    const { device_type, device_id } = req.query

    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    if (device_type) {
      whereClause += ' AND device_type = ?'
      params.push(device_type as string)
    }

    if (device_id) {
      whereClause += ' AND device_id = ?'
      params.push(Number(device_id))
    }

    const stmt = db.prepare(`
      SELECT ds.*
      FROM device_status ds
      INNER JOIN (
        SELECT device_type, device_id, MAX(timestamp) as max_time
        FROM device_status
        ${whereClause}
        GROUP BY device_type, device_id
      ) latest ON ds.device_type = latest.device_type 
              AND ds.device_id = latest.device_id 
              AND ds.timestamp = latest.max_time
      ORDER BY ds.device_type, ds.device_id
    `)
    const list = stmt.all(...params)

    res.json({
      success: true,
      data: list,
    })
  } catch (error) {
    console.error('Get latest device status error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取最新设备状态失败',
    })
  }
})

router.get('/history', (req: Request, res: Response): void => {
  try {
    const { device_type, device_id, start_time, end_time, page = 1, pageSize = 100 } = req.query

    if (!device_type || !device_id) {
      res.status(400).json({
        success: false,
        message: '设备类型和设备ID为必填项',
      })
      return
    }

    let whereClause = 'WHERE device_type = ? AND device_id = ?'
    const params: (string | number)[] = [device_type as string, Number(device_id)]

    if (start_time) {
      whereClause += ' AND timestamp >= ?'
      params.push(start_time as string)
    }

    if (end_time) {
      whereClause += ' AND timestamp <= ?'
      params.push(end_time as string)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM device_status ${whereClause}
    `)
    const { total } = countStmt.get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    const listStmt = db.prepare(`
      SELECT * FROM device_status ${whereClause}
      ORDER BY timestamp DESC
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
    console.error('Get device history error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取设备历史数据失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const stmt = db.prepare(`
      SELECT * FROM device_status WHERE id = ?
    `)
    const status = stmt.get(Number(id) as any)

    if (!status) {
      res.status(404).json({
        success: false,
        message: '设备状态记录不存在',
      })
      return
    }

    res.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Get device status error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取设备状态详情失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      device_type, device_id, device_code, gate_opening,
      flow_rate, water_level, pump_status, voltage, current,
      temperature, status, timestamp, user_name
    } = req.body

    if (!device_type || !device_id || !device_code) {
      res.status(400).json({
        success: false,
        message: '设备类型、设备ID、设备编码为必填项',
      })
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO device_status 
      (device_type, device_id, device_code, gate_opening, flow_rate, water_level, pump_status, voltage, current, temperature, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = insertStmt.run(
      device_type,
      Number(device_id),
      device_code,
      gate_opening !== undefined ? Number(gate_opening) : null,
      flow_rate !== undefined ? Number(flow_rate) : null,
      water_level !== undefined ? Number(water_level) : null,
      pump_status || null,
      voltage !== undefined ? Number(voltage) : null,
      current !== undefined ? Number(current) : null,
      temperature !== undefined ? Number(temperature) : null,
      status || 'normal',
      timestamp || null
    )

    createLog(
      user_name || '系统',
      '设备状态',
      '上报',
      Number(result.lastInsertRowid),
      `设备${device_code}状态上报`,
      getClientIp(req)
    )

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '设备状态上报成功',
    })
  } catch (error) {
    console.error('Create device status error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '设备状态上报失败',
    })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const {
      device_type, device_id, device_code, gate_opening,
      flow_rate, water_level, pump_status, voltage, current,
      temperature, status, user_name
    } = req.body

    const existingStmt = db.prepare(`
      SELECT * FROM device_status WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '设备状态记录不存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE device_status
      SET device_type = ?, device_id = ?, device_code = ?, gate_opening = ?, flow_rate = ?, water_level = ?, pump_status = ?, voltage = ?, current = ?, temperature = ?, status = ?
      WHERE id = ?
    `)
    updateStmt.run(
      device_type || existing.device_type,
      Number(device_id) || existing.device_id,
      device_code || existing.device_code,
      gate_opening !== undefined ? Number(gate_opening) : existing.gate_opening,
      flow_rate !== undefined ? Number(flow_rate) : existing.flow_rate,
      water_level !== undefined ? Number(water_level) : existing.water_level,
      pump_status !== undefined ? pump_status : existing.pump_status,
      voltage !== undefined ? Number(voltage) : existing.voltage,
      current !== undefined ? Number(current) : existing.current,
      temperature !== undefined ? Number(temperature) : existing.temperature,
      status || existing.status,
      Number(id)
    )

    createLog(
      user_name || '系统',
      '设备状态',
      '更新',
      Number(id),
      `更新设备${device_code || existing.device_code}状态记录`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '更新设备状态成功',
    })
  } catch (error) {
    console.error('Update device status error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新设备状态失败',
    })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { user_name } = req.query

    const existingStmt = db.prepare(`
      SELECT * FROM device_status WHERE id = ?
    `)
    const existing = existingStmt.get(Number(id) as any)
    if (!existing) {
      res.status(404).json({
        success: false,
        message: '设备状态记录不存在',
      })
      return
    }

    const deleteStmt = db.prepare(`
      DELETE FROM device_status WHERE id = ?
    `)
    deleteStmt.run(Number(id))

    createLog(
      (user_name as string) || '系统',
      '设备状态',
      '删除',
      Number(id),
      `删除设备${existing.device_code}状态记录`,
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '删除设备状态成功',
    })
  } catch (error) {
    console.error('Delete device status error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除设备状态失败',
    })
  }
})

export default router
