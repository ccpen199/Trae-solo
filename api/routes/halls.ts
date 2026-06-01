import express from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const { status } = req.query
    let sql = 'SELECT * FROM banquet_halls WHERE 1=1'
    const params: any[] = []
    
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    
    sql += ' ORDER BY id'
    
    const halls = db.prepare(sql).all(...params)
    res.json({ success: true, data: halls })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const hall = db.prepare(`
      SELECT * FROM banquet_halls WHERE id = ?
    `).get(req.params.id)
    if (!hall) {
      return res.status(404).json({ success: false, error: '宴会厅不存在' })
    }
    res.json({ success: true, data: hall })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { name, capacity, min_consumption, location, facilities, description, status } = req.body
    const result = db.prepare(`
      INSERT INTO banquet_halls (name, capacity, min_consumption, location, facilities, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, capacity, min_consumption || 0, location, facilities, description, status || 'active')
    
    const hall = db.prepare('SELECT * FROM banquet_halls WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: hall })
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: '宴会厅名称已存在' })
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const { name, capacity, min_consumption, location, facilities, description, status } = req.body
    const result = db.prepare(`
      UPDATE banquet_halls 
      SET name = ?, capacity = ?, min_consumption = ?, location = ?, facilities = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, capacity, min_consumption, location, facilities, description, status, req.params.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '宴会厅不存在' })
    }
    
    const hall = db.prepare('SELECT * FROM banquet_halls WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: hall })
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: '宴会厅名称已存在' })
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM banquet_halls WHERE id = ?').run(req.params.id)
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '宴会厅不存在' })
    }
    res.json({ success: true, message: '删除成功' })
  } catch (error: any) {
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return res.status(400).json({ success: false, error: '该宴会厅已有预订，无法删除' })
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
