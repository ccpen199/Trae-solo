import express from 'express'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []
    if (status) {
      whereClause += ' AND status = ?'
      params.push(status)
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM vehicles WHERE ${whereClause}`).get(...params).count
    const vehicles = db.prepare(`SELECT * FROM vehicles WHERE ${whereClause} LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)

    res.json({ data: vehicles, total })
  } catch (error) {
    res.status(500).json({ message: '获取车辆列表失败' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: '车辆不存在' })
    }
    res.json({ data: vehicle })
  } catch (error) {
    res.status(500).json({ message: '获取车辆详情失败' })
  }
})

router.get('/:id/location', (req, res) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: '车辆不存在' })
    }
    res.json({ data: { lat: vehicle.current_lat, lng: vehicle.current_lng, address: vehicle.current_address } })
  } catch (error) {
    res.status(500).json({ message: '获取位置失败' })
  }
})

router.put('/:id', (req, res) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: '车辆不存在' })
    }

    const updates = []
    const values = []
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        updates.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (updates.length > 0) {
      values.push(req.params.id)
      db.prepare(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }

    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id)
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ message: '更新车辆失败' })
  }
})

export default router
