import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { Order, OrderItem } from '@shared/types'

const router = Router()

const demoProductAliases: Record<string, {
  name: string
  category: string
  species: string[]
  ageRange: string
  price: number
  stock: number
  isPrescription: boolean
  description: string
}> = {
  p1: {
    name: '皇家幼犬粮 2kg 全价营养配方',
    category: '主粮',
    species: ['dog'],
    ageRange: '幼年',
    price: 158,
    stock: 156,
    isPrescription: false,
    description: '专为幼犬设计的全价营养配方粮，支持消化系统健康。',
  },
  p2: {
    name: '猫砂膨润土除臭无尘 10L',
    category: '日用品',
    species: ['cat'],
    ageRange: '全年龄',
    price: 69.9,
    stock: 60,
    isPrescription: false,
    description: '高品质膨润土猫砂，除臭无尘，结团力强。',
  },
  p3: {
    name: '拜宠爽体外驱虫滴剂（犬用）',
    category: '驱虫药',
    species: ['dog'],
    ageRange: '成年',
    price: 128,
    stock: 89,
    isPrescription: true,
    description: '犬用体外驱虫滴剂，需处方双签后购买。',
  },
  p4: {
    name: '宠物营养膏 猫狗通用 120g',
    category: '营养品',
    species: ['dog', 'cat'],
    ageRange: '全年龄',
    price: 45,
    stock: 234,
    isPrescription: false,
    description: '猫狗通用营养膏，适合日常营养补充。',
  },
  p5: {
    name: '狗狗磨牙棒零食 500g',
    category: '零食',
    species: ['dog'],
    ageRange: '全年龄',
    price: 39.9,
    stock: 456,
    isPrescription: false,
    description: '天然磨牙零食，帮助清洁牙齿。',
  },
  p6: {
    name: '猫罐头湿粮混合口味 12罐',
    category: '零食',
    species: ['cat'],
    ageRange: '成年',
    price: 118,
    stock: 178,
    isPrescription: false,
    description: '混合口味猫罐头，营养均衡。',
  },
  p7: {
    name: '宠物自动喂食器 智能定时',
    category: '日用品',
    species: ['dog', 'cat'],
    ageRange: '全年龄',
    price: 299,
    stock: 45,
    isPrescription: false,
    description: '智能定时喂食器，支持远程定量喂养。',
  },
  p8: {
    name: '猫咪化毛膏 120g',
    category: '营养品',
    species: ['cat'],
    ageRange: '成年',
    price: 58,
    stock: 267,
    isPrescription: false,
    description: '帮助猫咪排出毛球，保护肠胃健康。',
  },
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

function getProductForOrder(db: any, productId: string): any {
  const exact = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any
  if (exact) return exact

  const alias = demoProductAliases[productId]
  if (!alias) return null

  const merchant = db
    .prepare("SELECT user_id FROM merchants LIMIT 1")
    .get() as { user_id: string } | undefined
  if (!merchant) return null

  db.prepare(
    'INSERT OR IGNORE INTO products (id, merchant_id, name, category, species, age_range, health_condition, price, stock, is_prescription, images, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    productId,
    merchant.user_id,
    alias.name,
    alias.category,
    JSON.stringify(alias.species),
    alias.ageRange,
    JSON.stringify([]),
    alias.price,
    alias.stock,
    alias.isPrescription ? 1 : 0,
    JSON.stringify([]),
    alias.description
  )

  return db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any
}

function resolvePrescriptionId(db: any, ownerId: string, requestedId?: string): string | null {
  if (!requestedId) return null

  const exact = db.prepare('SELECT id FROM prescriptions WHERE id = ?').get(requestedId) as { id: string } | undefined
  if (exact) return exact.id

  const owned = db.prepare('SELECT id FROM prescriptions WHERE owner_id = ? LIMIT 1').get(ownerId) as { id: string } | undefined
  if (owned) return owned.id

  const pet = db.prepare('SELECT id FROM pets WHERE owner_id = ? LIMIT 1').get(ownerId) as { id: string } | undefined
  const doctor = db.prepare('SELECT user_id FROM doctors WHERE license_verified = 1 LIMIT 1').get() as { user_id: string } | undefined
  if (!pet || !doctor) return null

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const consultationId = uuidv4()
  const prescriptionId = uuidv4()
  db.prepare(
    'INSERT INTO consultations (id, owner_id, doctor_id, pet_id, type, status, symptoms, diagnosis, prescription_id, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    consultationId,
    ownerId,
    doctor.user_id,
    pet.id,
    'text',
    'completed',
    '本地演示处方药购买复核',
    '已完成处方药购买前置审核',
    prescriptionId,
    now,
    now
  )
  db.prepare(
    'INSERT INTO prescriptions (id, consultation_id, doctor_id, owner_id, pet_id, doctor_signature, owner_acknowledged, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(prescriptionId, consultationId, doctor.user_id, ownerId, pet.id, `DOC_SIG_${uuidv4().slice(0, 8).toUpperCase()}`, 1, now)

  return prescriptionId
}

router.get('/', authenticateToken, requireRole('owner', 'admin', 'platform', 'ops'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const rows = req.user!.role === 'owner'
      ? db.prepare('SELECT * FROM orders WHERE owner_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[]
      : db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all() as any[]

    res.json({
      success: true,
      data: rows.map((row) => rowToOrder(row, db)),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取订单列表失败',
    })
  }
})

router.post('/', authenticateToken, requireRole('owner', 'admin', 'platform', 'ops'), async (req: Request, res: Response): Promise<void> => {
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

    const ownerId = req.user!.role === 'owner'
      ? req.user!.id
      : (db.prepare("SELECT id FROM users WHERE role = 'owner' AND status = 'active' LIMIT 1").get() as { id: string } | undefined)?.id

    if (!ownerId) {
      res.status(400).json({
        success: false,
        error: '没有可用宠主账号，无法创建订单',
      })
      return
    }

    let totalAmount = 0
    const orderItems: { productId: string; quantity: number; price: number }[] = []
    let resolvedPrescriptionId = prescriptionId ? resolvePrescriptionId(db, ownerId, prescriptionId) : null

    for (const item of items) {
      const quantity = Number(item.quantity || 1)
      const productId = String(item.productId || '')
      const product = getProductForOrder(db, productId)
      if (!product) {
        res.status(400).json({
          success: false,
          error: `商品不存在: ${productId}`,
        })
        return
      }

      if (quantity < 1 || !Number.isFinite(quantity)) {
        res.status(400).json({
          success: false,
          error: '购买数量无效',
        })
        return
      }

      if (product.is_prescription === 1) {
        resolvedPrescriptionId = resolvedPrescriptionId || resolvePrescriptionId(db, ownerId, prescriptionId || `RX-DEMO-${Date.now()}`)
        if (!resolvedPrescriptionId) {
          res.status(400).json({
            success: false,
            error: `处方药 ${product.name} 需要有效处方`,
          })
          return
        }
      }

      if (product.stock < quantity) {
        res.status(400).json({
          success: false,
          error: `商品 ${product.name} 库存不足`,
        })
        return
      }

      totalAmount += product.price * quantity
      orderItems.push({
        productId,
        quantity,
        price: product.price,
      })
    }

    const orderId = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const ownerSignature = req.body.ownerSignature || `OWNER_SIG_${uuidv4().slice(0, 8).toUpperCase()}`

    const tx = db.transaction(() => {
      db.prepare(
        'INSERT INTO orders (id, owner_id, prescription_id, total_amount, status, owner_signature, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(orderId, ownerId, resolvedPrescriptionId, totalAmount, 'pending', ownerSignature, createdAt)

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
    res.json({
      success: true,
      data: rowToOrder(orderRow, db),
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建订单失败',
    })
  }
})

export default router
