import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

interface AccessoryRow {
  id: string
  supplier_id: string
  name: string
  category: string
  material: string
  specs: string
  price: number
  unit: string
  min_order: number
  stock: number
  location: string
  images: string
  created_at: string
}

function formatRow(row: AccessoryRow) {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    name: row.name,
    category: row.category,
    material: row.material,
    specs: row.specs,
    price: row.price,
    unit: row.unit,
    minOrder: row.min_order,
    stock: row.stock,
    location: row.location,
    images: JSON.parse(row.images || '[]'),
    createdAt: row.created_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { category, location, material, supplierId } = req.query
    let sql = 'SELECT * FROM accessory_supplies WHERE 1=1'
    const params: unknown[] = []

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    if (location) {
      sql += ' AND location LIKE ?'
      params.push(`%${location}%`)
    }
    if (material) {
      sql += ' AND material LIKE ?'
      params.push(`%${material}%`)
    }
    if (supplierId) {
      sql += ' AND supplier_id = ?'
      params.push(supplierId)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params) as AccessoryRow[]
    res.json({ success: true, data: rows.map(formatRow) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取辅料列表失败' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { supplierId, name, category, material, specs, price, unit, minOrder, stock, location, images } = req.body

    if (!supplierId || !name || !category || price === undefined) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const id = uuidv4()
    db.prepare(
      `INSERT INTO accessory_supplies (id, supplier_id, name, category, material, specs, price, unit, min_order, stock, location, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, supplierId, name, category, material || '', specs || '', price, unit || '个', minOrder ?? 1, stock ?? 0, location || '', JSON.stringify(images || []))

    const row = db.prepare('SELECT * FROM accessory_supplies WHERE id = ?').get(id) as AccessoryRow
    res.status(201).json({ success: true, data: formatRow(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建辅料供应失败' })
  }
})

export default router
