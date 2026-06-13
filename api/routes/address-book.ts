import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { user_id, tag, page = '1', pageSize = '20' } = req.query
  const pageNum = parseInt(page as string)
  const pageSizeNum = parseInt(pageSize as string)
  const offset = (pageNum - 1) * pageSizeNum

  if (!user_id) {
    res.status(400).json({ success: false, error: '用户ID不能为空' })
    return
  }

  let whereClauses: string[] = ['user_id = ?']
  let params: any[] = [user_id]

  if (tag) {
    whereClauses.push('tag = ?')
    params.push(tag)
  }

  const whereSql = 'WHERE ' + whereClauses.join(' AND ')

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM address_book ${whereSql}`)
  const total = totalStmt.get(...params) as { count: number }

  const stmt = db.prepare(`SELECT * FROM address_book ${whereSql} ORDER BY is_default DESC, created_at DESC LIMIT ? OFFSET ?`)
  const addresses = stmt.all(...params, pageSizeNum, offset)

  res.json({
    success: true,
    data: {
      list: addresses,
      total: total.count,
      page: pageNum,
      pageSize: pageSizeNum,
    },
  })
})

router.get('/default/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params

  const stmt = db.prepare('SELECT * FROM address_book WHERE user_id = ? AND is_default = 1')
  const address = stmt.get(userId) as any

  if (!address) {
    const fallback = db.prepare('SELECT * FROM address_book WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId)
    if (!fallback) {
      res.status(404).json({ success: false, error: '地址簿为空' })
      return
    }
    res.json({ success: true, data: fallback })
    return
  }

  res.json({ success: true, data: address })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const stmt = db.prepare('SELECT * FROM address_book WHERE id = ?')
  const address = stmt.get(id) as any

  if (!address) {
    res.status(404).json({ success: false, error: '地址不存在' })
    return
  }

  res.json({ success: true, data: address })
})

router.post('/', (req: Request, res: Response): void => {
  const { user_id, name, phone, province, city, district, address, is_default = 0, tag = 'other' } = req.body

  if (!user_id || !name || !phone || !province || !city || !district || !address) {
    res.status(400).json({ success: false, error: '必填参数不能为空' })
    return
  }

  if (is_default) {
    db.prepare('UPDATE address_book SET is_default = 0 WHERE user_id = ?').run(user_id)
  }

  const id = randomUUID()
  const stmt = db.prepare(`
    INSERT INTO address_book (id, user_id, name, phone, province, city, district, address, is_default, tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(id, user_id, name, phone, province, city, district, address, is_default ? 1 : 0, tag)

  const newAddress = db.prepare('SELECT * FROM address_book WHERE id = ?').get(id)
  res.status(201).json({
    success: true,
    data: newAddress,
  })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { name, phone, province, city, district, address, is_default, tag } = req.body

  const addrStmt = db.prepare('SELECT * FROM address_book WHERE id = ?')
  const existing = addrStmt.get(id) as any

  if (!existing) {
    res.status(404).json({ success: false, error: '地址不存在' })
    return
  }

  if (is_default) {
    db.prepare('UPDATE address_book SET is_default = 0 WHERE user_id = ?').run(existing.user_id)
  }

  const updateFields: string[] = []
  const updateParams: any[] = []

  if (name !== undefined) {
    updateFields.push('name = ?')
    updateParams.push(name)
  }
  if (phone !== undefined) {
    updateFields.push('phone = ?')
    updateParams.push(phone)
  }
  if (province !== undefined) {
    updateFields.push('province = ?')
    updateParams.push(province)
  }
  if (city !== undefined) {
    updateFields.push('city = ?')
    updateParams.push(city)
  }
  if (district !== undefined) {
    updateFields.push('district = ?')
    updateParams.push(district)
  }
  if (address !== undefined) {
    updateFields.push('address = ?')
    updateParams.push(address)
  }
  if (is_default !== undefined) {
    updateFields.push('is_default = ?')
    updateParams.push(is_default ? 1 : 0)
  }
  if (tag !== undefined) {
    updateFields.push('tag = ?')
    updateParams.push(tag)
  }

  if (updateFields.length > 0) {
    updateParams.push(id)
    const stmt = db.prepare(`UPDATE address_book SET ${updateFields.join(', ')} WHERE id = ?`)
    stmt.run(...updateParams)
  }

  const updated = db.prepare('SELECT * FROM address_book WHERE id = ?').get(id)
  res.json({
    success: true,
    data: updated,
  })
})

router.put('/:id/set-default', (req: Request, res: Response): void => {
  const { id } = req.params

  const addrStmt = db.prepare('SELECT * FROM address_book WHERE id = ?')
  const existing = addrStmt.get(id) as any

  if (!existing) {
    res.status(404).json({ success: false, error: '地址不存在' })
    return
  }

  db.prepare('UPDATE address_book SET is_default = 0 WHERE user_id = ?').run(existing.user_id)
  db.prepare('UPDATE address_book SET is_default = 1 WHERE id = ?').run(id)

  const updated = db.prepare('SELECT * FROM address_book WHERE id = ?').get(id)
  res.json({
    success: true,
    data: updated,
  })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const addrStmt = db.prepare('SELECT * FROM address_book WHERE id = ?')
  const existing = addrStmt.get(id)

  if (!existing) {
    res.status(404).json({ success: false, error: '地址不存在' })
    return
  }

  const stmt = db.prepare('DELETE FROM address_book WHERE id = ?')
  stmt.run(id)

  res.json({
    success: true,
    message: '地址已删除',
  })
})

router.get('/search/nearby', (req: Request, res: Response): void => {
  const { user_id, keyword } = req.query

  if (!user_id || !keyword) {
    res.status(400).json({ success: false, error: '用户ID和关键词不能为空' })
    return
  }

  const addresses = db.prepare(`
    SELECT * FROM address_book
    WHERE user_id = ?
      AND (name LIKE ? OR phone LIKE ? OR address LIKE ? OR city LIKE ? OR district LIKE ?)
    ORDER BY is_default DESC, created_at DESC
    LIMIT 10
  `).all(user_id, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)

  res.json({
    success: true,
    data: addresses,
  })
})

export default router
