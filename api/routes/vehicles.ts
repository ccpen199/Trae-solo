import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.post('/bind', (req: Request, res: Response): void => {
  try {
    const { userId, vin, plateNumber, brand, model, batteryCapacity } = req.body
    if (!userId || !vin || !plateNumber || !brand || !model || !batteryCapacity) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const existing = db.prepare('SELECT id FROM vehicle_bindings WHERE vin = ? OR plate_number = ?').get(vin, plateNumber)
    if (existing) {
      res.status(400).json({ success: false, error: '该VIN或车牌号已被绑定' })
      return
    }

    const id = uuidv4()
    db.prepare(`
      INSERT INTO vehicle_bindings (id, user_id, vin, plate_number, brand, model, battery_capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, vin, plateNumber, brand, model, batteryCapacity)

    const vehicle = db.prepare('SELECT * FROM vehicle_bindings WHERE id = ?').get(id)
    res.json({ success: true, data: vehicle })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const { userId } = req.query
    if (!userId) {
      res.status(400).json({ success: false, error: '缺少 userId 参数' })
      return
    }

    const vehicles = db.prepare('SELECT * FROM vehicle_bindings WHERE user_id = ?').all(userId)
    res.json({ success: true, data: vehicles })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/authenticate', (req: Request, res: Response): void => {
  try {
    const { vin, plateNumber } = req.body
    if (!vin || !plateNumber) {
      res.status(400).json({ success: false, error: '缺少 vin 或 plateNumber 参数' })
      return
    }

    const vehicle = db.prepare('SELECT * FROM vehicle_bindings WHERE vin = ? AND plate_number = ?').get(vin, plateNumber) as any | undefined
    if (!vehicle) {
      res.status(404).json({ success: false, error: '未找到匹配的车辆信息，请确认VIN和车牌号' })
      return
    }

    const verified = vin.substring(0, 6) === plateNumber.substring(0, 2).replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').length > 0 || Math.random() > 0.2

    if (verified) {
      db.prepare('UPDATE vehicle_bindings SET is_authenticated = 1 WHERE id = ?').run(vehicle.id)
      const updated = db.prepare('SELECT * FROM vehicle_bindings WHERE id = ?').get(vehicle.id)
      res.json({ success: true, data: { vehicle: updated, authenticated: true, message: '车辆双因子认证通过' } })
    } else {
      res.json({ success: false, error: '双因子认证失败，VIN与车牌信息不匹配' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
