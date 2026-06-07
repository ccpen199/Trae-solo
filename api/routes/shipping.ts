import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const WEIGHT_TIERS = [
  { maxWeight: 1, price: 12 },
  { maxWeight: 3, price: 15 },
  { maxWeight: 5, price: 20 },
  { maxWeight: 10, price: 30 },
]

function getBaseFreight(weight: number): number {
  for (const tier of WEIGHT_TIERS) {
    if (weight <= tier.maxWeight) return tier.price
  }
  return 30 + Math.ceil(weight - 10) * 3
}

function getCompanyMultiplier(companyCode: string): number {
  const multipliers: Record<string, number> = { SF: 1.3, ZTO: 1.0, YTO: 0.9 }
  return multipliers[companyCode] || 1.0
}

router.get('/companies', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const companies = db.prepare('SELECT * FROM express_companies WHERE is_active = 1 ORDER BY name').all()
    res.json({ success: true, data: companies })
  } catch (error) {
    console.error('List express companies error:', error)
    res.status(500).json({ success: false, error: '获取快递公司列表失败' })
  }
})

router.post('/freight/calculate', (req: Request, res: Response): void => {
  try {
    const { weight, express_company_id, declared_value } = req.body

    if (!weight || weight <= 0) {
      res.status(400).json({ success: false, error: '重量必须大于0' })
      return
    }

    const db = getDb()
    let companyCode = 'ZTO'
    let companyName = '中通快递'
    let multiplier = 1.0

    if (express_company_id) {
      const company = db.prepare('SELECT * FROM express_companies WHERE id = ?').get(express_company_id) as Record<string, unknown> | undefined
      if (company) {
        companyCode = company.code as string
        companyName = company.name as string
        multiplier = getCompanyMultiplier(companyCode)
      }
    }

    const baseFreight = getBaseFreight(weight)
    const freight = Math.round(baseFreight * multiplier * 100) / 100

    let insuranceAmount = 0
    let insuranceDeducted = 0
    if (declared_value && declared_value > 0) {
      insuranceAmount = Math.round(declared_value * 0.01 * 100) / 100
      insuranceDeducted = Math.min(insuranceAmount, 5)
    }

    const totalAmount = Math.round((freight + insuranceAmount - insuranceDeducted) * 100) / 100

    res.json({
      success: true,
      data: {
        weight,
        express_company: companyName,
        express_code: companyCode,
        multiplier,
        base_freight: baseFreight,
        freight_amount: freight,
        insurance_amount: insuranceAmount,
        insurance_deducted: insuranceDeducted,
        total_amount: totalAmount,
        breakdown: {
          base_by_weight: baseFreight,
          company_multiplier: multiplier,
          freight_after_multiplier: freight,
          declared_value: declared_value || 0,
          insurance_rate: '1%',
          insurance_premium: insuranceAmount,
          auto_deduct_cap: 5,
          insurance_deducted: insuranceDeducted,
        },
      },
    })
  } catch (error) {
    console.error('Calculate freight error:', error)
    res.status(500).json({ success: false, error: '计算运费失败' })
  }
})

router.post('/order', authMiddleware, (req: Request, res: Response): void => {
  try {
    const {
      package_id, express_company_id, weight, declared_value,
    } = req.body

    if (!express_company_id || !weight || weight <= 0) {
      res.status(400).json({ success: false, error: '快递公司、重量为必填项' })
      return
    }

    const db = getDb()
    const company = db.prepare('SELECT * FROM express_companies WHERE id = ? AND is_active = 1').get(express_company_id) as Record<string, unknown> | undefined
    if (!company) {
      res.status(400).json({ success: false, error: '快递公司不存在或已停用' })
      return
    }

    const multiplier = getCompanyMultiplier(company.code as string)
    const baseFreight = getBaseFreight(weight)
    const freightAmount = Math.round(baseFreight * multiplier * 100) / 100

    let insuranceAmount = 0
    let insuranceDeducted = 0
    if (declared_value && declared_value > 0) {
      insuranceAmount = Math.round(declared_value * 0.01 * 100) / 100
      insuranceDeducted = Math.min(insuranceAmount, 5)
    }

    const totalAmount = Math.round((freightAmount + insuranceAmount - insuranceDeducted) * 100) / 100

    const id = uuidv4()
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    let actualPackageId = package_id || null
    if (!actualPackageId) {
      actualPackageId = uuidv4()
      db.prepare(`
        INSERT INTO packages (id, tracking_number, user_id, type, status,
          sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address,
          express_company_id, created_at, updated_at)
        VALUES (?, ?, ?, 'send', 'pending', '', '', '', '', '', '', ?, ?, ?)
      `).run(actualPackageId, `PKG-${Date.now()}`, req.user!.id, express_company_id, now, now)
    }

    db.prepare(`
      INSERT INTO shipping_orders (id, user_id, package_id, express_company_id, weight,
        freight_amount, insurance_amount, insurance_deducted, total_amount, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(id, req.user!.id, actualPackageId, express_company_id, weight,
      freightAmount, insuranceAmount, insuranceDeducted, totalAmount, now, now)

    const order = db.prepare(`
      SELECT so.*, ec.name as express_company_name, p.tracking_number
      FROM shipping_orders so
      LEFT JOIN express_companies ec ON so.express_company_id = ec.id
      LEFT JOIN packages p ON so.package_id = p.id
      WHERE so.id = ?
    `).get(id)

    res.status(201).json({ success: true, data: order })
  } catch (error) {
    console.error('Create shipping order error:', error)
    res.status(500).json({ success: false, error: '创建寄件订单失败' })
  }
})

router.get('/orders', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.query
    const db = getDb()

    let sql = `
      SELECT so.*, ec.name as express_company_name, p.tracking_number
      FROM shipping_orders so
      LEFT JOIN express_companies ec ON so.express_company_id = ec.id
      LEFT JOIN packages p ON so.package_id = p.id
      WHERE so.user_id = ?
    `
    const params: unknown[] = [req.user!.id]

    if (status) {
      sql += ' AND so.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY so.created_at DESC'
    const orders = db.prepare(sql).all(...params)

    res.json({ success: true, data: orders })
  } catch (error) {
    console.error('List shipping orders error:', error)
    res.status(500).json({ success: false, error: '获取寄件订单列表失败' })
  }
})

router.get('/orders/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const order = db.prepare(`
      SELECT so.*, ec.name as express_company_name, ec.code as express_code, p.tracking_number
      FROM shipping_orders so
      LEFT JOIN express_companies ec ON so.express_company_id = ec.id
      LEFT JOIN packages p ON so.package_id = p.id
      WHERE so.id = ?
    `).get(req.params.id)

    if (!order) {
      res.status(404).json({ success: false, error: '寄件订单不存在' })
      return
    }

    res.json({ success: true, data: order })
  } catch (error) {
    console.error('Get shipping order error:', error)
    res.status(500).json({ success: false, error: '获取寄件订单详情失败' })
  }
})

router.put('/orders/:id/status', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'picked_up', 'in_transit', 'delivered', 'stored_in_cabinet']
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值' })
      return
    }

    const db = getDb()
    const order = db.prepare('SELECT * FROM shipping_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '寄件订单不存在' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    const updateOrder = db.transaction(() => {
      db.prepare('UPDATE shipping_orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id)

      if (status === 'picked_up' && order.package_id) {
        db.prepare('UPDATE packages SET status = ?, updated_at = ? WHERE id = ?').run('stored', now, order.package_id as string)
      }
      if (status === 'delivered' && order.package_id) {
        db.prepare('UPDATE packages SET status = ?, updated_at = ? WHERE id = ?').run('picked_up', now, order.package_id as string)
      }
    })

    updateOrder()

    const updated = db.prepare(`
      SELECT so.*, ec.name as express_company_name, p.tracking_number
      FROM shipping_orders so
      LEFT JOIN express_companies ec ON so.express_company_id = ec.id
      LEFT JOIN packages p ON so.package_id = p.id
      WHERE so.id = ?
    `).get(req.params.id)

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update shipping order status error:', error)
    res.status(500).json({ success: false, error: '更新寄件订单状态失败' })
  }
})

export default router
