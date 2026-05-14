const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const db = require('../models/database')

router.get('/', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const addresses = await db.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId])
    res.json({ code: 200, data: addresses })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { name, phone, province, city, district, detail, isDefault = 0 } = req.body
    
    if (!name || !phone || !detail) {
      return res.status(400).json({ code: 400, message: '姓名、手机号和详细地址不能为空' })
    }
    
    if (isDefault === 1) {
      await db.run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId])
    }
    
    const result = await db.run(
      'INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, phone, province, city, district, detail, isDefault]
    )
    
    res.json({ code: 200, message: '添加地址成功', data: { addressId: result.lastID } })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { id } = req.params
    const { name, phone, province, city, district, detail, isDefault } = req.body
    
    const address = await db.get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, userId])
    if (!address) {
      return res.status(404).json({ code: 404, message: '地址不存在' })
    }
    
    if (isDefault === 1) {
      await db.run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId])
    }
    
    await db.run(
      'UPDATE addresses SET name = ?, phone = ?, province = ?, city = ?, district = ?, detail = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, province, city, district, detail, isDefault || 0, id]
    )
    
    res.json({ code: 200, message: '更新地址成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { userId } = req.user
    const { id } = req.params
    
    const address = await db.get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, userId])
    if (!address) {
      return res.status(404).json({ code: 404, message: '地址不存在' })
    }
    
    await db.run('DELETE FROM addresses WHERE id = ?', [id])
    
    res.json({ code: 200, message: '删除地址成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.get('/nearby', async (req, res) => {
  try {
    const { longitude = 116.4730, latitude = 39.9923 } = req.query
    
    const stores = await db.query(`
      SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
      FROM stores
      ORDER BY distance
      LIMIT 10
    `, [latitude, longitude, latitude])
    
    res.json({ code: 200, data: stores })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

module.exports = router