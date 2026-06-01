import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

const DEFAULT_PORTS: Record<string, { count: number; types: string[] }> = {
  'DC-120kW': { count: 4, types: ['DC', 'DC', 'DC', 'AC'] },
  'DC-180kW': { count: 4, types: ['DC', 'DC', 'DC', 'AC'] },
  'DC-60kW': { count: 4, types: ['DC', 'DC', 'AC', 'AC'] },
  'AC-7kW': { count: 4, types: ['AC', 'AC', 'AC', 'AC'] },
}

interface DeviceRow {
  id: number
  site_id: number
  name: string
  model: string
  power: number
  online: number
  fault_code: string | null
  last_heartbeat: string
  status: string
  created_at: string
  updated_at: string
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { site_id, online } = req.query
    let sql = 'SELECT * FROM devices'
    const params: unknown[] = []
    const conditions: string[] = []

    if (site_id) {
      conditions.push('site_id = ?')
      params.push(site_id)
    }
    if (online !== undefined) {
      conditions.push('online = ?')
      params.push(online === '1' || online === 'true' ? 1 : 0)
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY created_at DESC'

    const devices = db.prepare(sql).all(...params) as DeviceRow[]

    const devicesWithPorts = devices.map((d) => ({
      ...d,
      ports: db.prepare('SELECT * FROM device_ports WHERE device_id = ?').all(d.id),
      site_name: (db.prepare('SELECT name FROM sites WHERE id = ?').get(d.site_id) as { name: string } | undefined)?.name,
    }))

    res.json({ success: true, data: devicesWithPorts })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as DeviceRow | undefined

    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' })
      return
    }

    const ports = db.prepare('SELECT * FROM device_ports WHERE device_id = ?').all(req.params.id)
    const recentOrders = db.prepare(
      'SELECT * FROM orders WHERE device_id = ? ORDER BY created_at DESC LIMIT 10',
    ).all(req.params.id)
    const relatedWorkOrders = db.prepare(`
      SELECT wo.*, s.name as site_name
      FROM work_orders wo
      LEFT JOIN sites s ON wo.site_id = s.id
      WHERE wo.device_id = ?
      ORDER BY wo.created_at DESC LIMIT 10
    `).all(req.params.id)

    res.json({ success: true, data: { ...device, ports, recentOrders, relatedWorkOrders } })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { site_id, name, model, power, online, fault_code, status } = req.body

    if (!site_id || !name || !model) {
      res.status(400).json({ success: false, error: 'site_id, name, and model are required' })
      return
    }

    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(site_id)
    if (!site) {
      res.status(400).json({ success: false, error: 'Site not found' })
      return
    }

    const deviceResult = db.prepare(`
      INSERT INTO devices (site_id, name, model, power, online, fault_code, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      site_id,
      name,
      model,
      power ?? 0.0,
      online ?? 1,
      fault_code ?? null,
      status ?? 'active',
    )

    const deviceId = deviceResult.lastInsertRowid
    const portConfig = DEFAULT_PORTS[model] || { count: 4, types: ['AC', 'AC', 'AC', 'AC'] }

    const insertPort = db.prepare(
      'INSERT INTO device_ports (device_id, port_number, status, connector_type) VALUES (?, ?, ?, ?)',
    )
    for (let i = 0; i < portConfig.count; i++) {
      insertPort.run(deviceId, i + 1, 'idle', portConfig.types[i])
    }

    db.prepare('UPDATE sites SET device_count = device_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(site_id)

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as DeviceRow
    const ports = db.prepare('SELECT * FROM device_ports WHERE device_id = ?').all(deviceId)
    res.status(201).json({ success: true, data: { ...device, ports } })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as DeviceRow | undefined

    if (!existing) {
      res.status(404).json({ success: false, error: 'Device not found' })
      return
    }

    const { name, model, power, online, fault_code, status } = req.body

    db.prepare(`
      UPDATE devices SET
        name = ?, model = ?, power = ?, online = ?, fault_code = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ?? existing.name,
      model ?? existing.model,
      power ?? existing.power,
      online !== undefined ? online : existing.online,
      fault_code !== undefined ? fault_code : existing.fault_code,
      status ?? existing.status,
      req.params.id,
    )

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: device })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.patch('/:id/heartbeat', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)

    if (!existing) {
      res.status(404).json({ success: false, error: 'Device not found' })
      return
    }

    db.prepare(
      'UPDATE devices SET online = 1, last_heartbeat = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(req.params.id)

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: device })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.patch('/:id/offline', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as DeviceRow | undefined

    if (!existing) {
      res.status(404).json({ success: false, error: 'Device not found' })
      return
    }

    db.prepare(
      'UPDATE devices SET online = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(req.params.id)

    db.prepare(`
      INSERT INTO work_orders (device_id, site_id, type, status, priority, description)
      VALUES (?, ?, 'device_offline', 'pending', 'high', ?)
    `).run(
      existing.id,
      existing.site_id,
      `设备 ${existing.name} 离线，故障码: ${existing.fault_code || '无'}，最后心跳: ${existing.last_heartbeat}`,
    )

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: device })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router
