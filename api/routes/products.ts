import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database.js'
import { optionalAuth, authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { Product, Order, OrderItem } from '@shared/types'

const router = Router()

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    name: row.name,
    category: row.category,
    species: JSON.parse(row.species || '[]'),
    ageRange: row.age_range,
    healthCondition: JSON.parse(row.health_condition || '[]'),
    price: row.price,
    stock: row.stock,
    isPrescription: row.is_prescription === 1,
    images: JSON.parse(row.images || '[]'),
    description: row.description,
  }
}

function rowToOrder(row: any, db: any): Order {
  const itemRows = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(row.id) as any[]
  const items: OrderItem[] = itemRows.map((i: any) => ({
    id: i.id,
    orderId: i.order_id,
    productId: i.product_id,
    quantity: i.quantity,
    price: i.price,
  }))

  return {
    id: row.id,
    ownerId: row.owner_id,
    prescriptionId: row.prescription_id,
    totalAmount: row.total_amount,
    status: row.status,
    ownerSignature: row.owner_signature,
    createdAt: row.created_at,
    items,
  }
}

router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const { category, species, isPrescription, keyword } = req.query as any

    let sql = 'SELECT * FROM products WHERE 1=1'
    const params: any[] = []

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }

    if (species) {
      sql += ' AND species LIKE ?'
      params.push(`%${species}%`)
    }

    if (isPrescription !== undefined) {
      sql += ' AND is_prescription = ?'
      params.push(isPrescription === 'true' ? 1 : 0)
    }

    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    sql += ' ORDER BY id DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    const products = rows.map(rowToProduct)

    res.json({
      success: true,
      data: products,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取商品列表失败',
    })
  }
})

router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any

    if (!row) {
      res.status(404).json({
        success: false,
        error: '商品不存在',
      })
      return
    }

    const product = rowToProduct(row)

    res.json({
      success: true,
      data: product,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取商品详情失败',
    })
  }
})

router.post('/orders', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const { items, prescriptionId } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: '订单项不能为空',
      })
      return
    }

    let totalAmount = 0
    const orderItems: { productId: string; quantity: number; price: number }[] = []

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId) as any
      if (!product) {
        res.status(400).json({
          success: false,
          error: `商品不存在: ${item.productId}`,
        })
        return
      }

      if (product.is_prescription === 1 && !prescriptionId) {
        res.status(400).json({
          success: false,
          error: `处方药 ${product.name} 需要处方`,
        })
        return
      }

      if (product.stock < item.quantity) {
        res.status(400).json({
          success: false,
          error: `商品 ${product.name} 库存不足`,
        })
        return
      }

      totalAmount += product.price * item.quantity
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      })
    }

    const orderId = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const ownerSignature = `OWNER_SIG_${uuidv4().slice(0, 8).toUpperCase()}`

    const tx = db.transaction(() => {
      db.prepare(
        'INSERT INTO orders (id, owner_id, prescription_id, total_amount, status, owner_signature, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(orderId, req.user!.id, prescriptionId || null, totalAmount, 'pending', ownerSignature, createdAt)

      const insertItem = db.prepare(
        'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)'
      )

      const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')

      for (const item of orderItems) {
        insertItem.run(uuidv4(), orderId, item.productId, item.quantity, item.price)
        updateStock.run(item.quantity, item.productId)
      }
    })

    tx()

    const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    const order = rowToOrder(orderRow, db)

    res.json({
      success: true,
      data: order,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建订单失败',
    })
  }
})

router.post('/orders/:id/verify-prescription', authenticateToken, requireRole('doctor', 'merchant'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any

    if (!order) {
      res.status(404).json({
        success: false,
        error: '订单不存在',
      })
      return
    }

    if (!order.prescription_id) {
      res.status(400).json({
        success: false,
        error: '该订单无需处方',
      })
      return
    }

    const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(order.prescription_id) as any

    if (!prescription) {
      res.status(400).json({
        success: false,
        error: '处方不存在',
        verified: false,
      })
      return
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('paid', order.id)

    res.json({
      success: true,
      data: {
        verified: true,
        prescriptionId: prescription.id,
        doctorId: prescription.doctor_id,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '处方验证失败',
    })
  }
})

export default router
