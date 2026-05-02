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

    const total = db.prepare(`SELECT COUNT(*) as count FROM drivers WHERE ${whereClause}`).get(...params).count
    const drivers = db.prepare(`SELECT * FROM drivers WHERE ${whereClause} LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)

    res.json({ data: drivers, total })
  } catch (error) {
    res.status(500).json({ message: '获取司机列表失败' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id)
    if (!driver) {
      return res.status(404).json({ message: '司机不存在' })
    }
    res.json({ data: driver })
  } catch (error) {
    res.status(500).json({ message: '获取司机详情失败' })
  }
})

export default router
