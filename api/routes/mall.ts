import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

function generateOrderNo() {
  const timestamp = Date.now().toString(36).toUpperCase()
  return `ORD-${timestamp}`
}

const services = [
  { id: 1, name: '深度清洁服务', name_en: 'Deep Cleaning Service', price: 250, category: 'cleaning', unit: '次', rating: 4.8, provider: 'Sydney HomeCare', description: '退租、入住前整屋深度清洁，含厨房与卫浴。' },
  { id: 2, name: '常规清洁服务', name_en: 'Regular Cleaning Service', price: 150, category: 'cleaning', unit: '次', rating: 4.6, provider: 'AUS Clean Team', description: '周期性保洁，适合长租房日常维护。' },
  { id: 3, name: '花园维护', name_en: 'Garden Maintenance', price: 180, category: 'maintenance', unit: '次', rating: 4.7, provider: 'Green Yard AU', description: '草坪修剪、枝叶清理和花园基础养护。' },
  { id: 4, name: '害虫防治', name_en: 'Pest Control', price: 220, category: 'maintenance', unit: '次', rating: 4.9, provider: 'Safe Pest Control', description: '白蚁、蟑螂、蚂蚁等常见虫害检查与处理。' },
  { id: 5, name: '空调维修', name_en: 'Air Conditioning Repair', price: 350, category: 'repair', unit: '次', rating: 4.5, provider: 'CoolFix Services', description: '空调故障检测、滤网清理和基础维修。' },
  { id: 6, name: '管道维修', name_en: 'Plumbing Repair', price: 280, category: 'repair', unit: '次', rating: 4.6, provider: 'Rapid Plumbing', description: '漏水、堵塞和水龙头更换等管道维修。' },
  { id: 7, name: '电气检查', name_en: 'Electrical Inspection', price: 320, category: 'inspection', unit: '次', rating: 4.7, provider: 'Licensed Spark', description: '出租物业电气安全检查并出具记录。' },
  { id: 8, name: '建筑检查', name_en: 'Building Inspection', price: 450, category: 'inspection', unit: '份', rating: 4.8, provider: 'Wilson Building Inspections', description: '购房或年度建筑状态检查报告。' },
  { id: 9, name: '税务咨询', name_en: 'Tax Consultation', price: 300, category: 'professional', unit: '小时', rating: 4.9, provider: 'Zhang Tax & Accounting', description: '跨境房产租金、折旧和土地税咨询。' },
  { id: 10, name: '法律咨询', name_en: 'Legal Consultation', price: 350, category: 'professional', unit: '小时', rating: 4.8, provider: 'Chen & Associates', description: '租约、合规和跨境资产法律咨询。' },
  { id: 11, name: '物业管理费(季度)', name_en: 'Property Management Fee (Quarterly)', price: 1320, category: 'management', unit: '季度', rating: 4.6, provider: 'AusAsset PM', description: '季度物业托管、租客沟通与账单跟踪。' },
  { id: 12, name: '房屋保险(年度)', name_en: 'Landlord Insurance (Annual)', price: 1200, category: 'insurance', unit: '年', rating: 4.7, provider: 'AUS Landlord Cover', description: '业主房屋保险代办与续保提醒。' },
]

router.get('/services', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query
    
    let filtered = services
    if (category) {
      filtered = services.filter(s => s.category === category)
    }
    
    res.json({
      success: true,
      data: filtered
    })
  } catch (e) {
    next(e)
  }
})

router.get('/orders', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize, limit, owner_id, status } = req.query
    const resolvedPageSize = Number(pageSize || limit || 20)
    const offset = (Number(page) - 1) * resolvedPageSize
    
    let fromWhere = `
      FROM mall_orders m
      JOIN owners o ON m.owner_id = o.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (owner_id) {
      fromWhere += ' AND m.owner_id = ?'
      params.push(owner_id)
    }
    if (status) {
      fromWhere += ' AND m.status = ?'
      params.push(status)
    }
    
    let query = `
      SELECT m.*, o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh
      ${fromWhere}
    `
    const countQuery = `SELECT COUNT(*) as count ${fromWhere}`
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count
    
    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?'
    params.push(resolvedPageSize, offset)
    
    const orders = db.prepare(query).all(...params).map((order: any) => {
      const items = parseOrderItems(order.items)
      const firstItem = items[0]
      return {
        ...order,
        service_name: firstItem?.name || order.order_type || '服务订单',
        quantity: firstItem?.quantity || 1,
        tracking_info: order.shipping_tracking || order.notes || '订单已提交，等待服务商确认',
      }
    })
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        pageSize: resolvedPageSize,
        total,
        totalPages: Math.ceil(total / resolvedPageSize)
      }
    })
  } catch (e) {
    next(e)
  }
})

router.get('/orders/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = db.prepare(`
      SELECT m.*, o.full_name_en as owner_name_en, o.full_name_zh as owner_name_zh,
             o.email as owner_email, o.phone as owner_phone
      FROM mall_orders m
      JOIN owners o ON m.owner_id = o.id
      WHERE m.id = ?
    `).get(req.params.id)
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' })
    }
    
    res.json({ success: true, data: order })
  } catch (e) {
    next(e)
  }
})

router.post('/orders', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = normalizeOrderPayload(req.body)
    const order_no = data.order_no || generateOrderNo()
    
    const result = db.prepare(`
      INSERT INTO mall_orders (
        order_no, owner_id, order_type, items, total_amount, currency,
        payment_method, payment_status, shipping_address, status, ordered_at, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order_no, data.owner_id, data.order_type,
      JSON.stringify(data.items || []), data.total_amount, data.currency || 'AUD',
      data.payment_method, data.payment_status || 'pending', data.shipping_address,
      data.status || 'pending', data.ordered_at || new Date().toISOString(),
      data.paid_at
    )
    
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, 'create', 'mall_order', ?, ?)
    `).run(req.user!.id, result.lastInsertRowid, JSON.stringify({ ...data, order_no }))
    
    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, order_no, ...data }
    })
  } catch (e) {
    next(e)
  }
})

router.put('/orders/:id/payment', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM mall_orders WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Order not found' })
    }
    
    db.prepare(`
      UPDATE mall_orders SET
        payment_status = 'paid', paid_at = CURRENT_TIMESTAMP, status = 'processing',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id)
    
    res.json({ success: true, message: 'Payment confirmed successfully' })
  } catch (e) {
    next(e)
  }
})

router.put('/orders/:id/status', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM mall_orders WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Order not found' })
    }
    
    const { status, shipping_tracking } = req.body
    const updates: string[] = []
    const params: any[] = []
    
    if (status) {
      updates.push('status = ?')
      params.push(status)
    }
    if (shipping_tracking) {
      updates.push('shipping_tracking = ?')
      params.push(shipping_tracking)
    }
    if (status === 'shipped') {
      updates.push('shipped_at = CURRENT_TIMESTAMP')
    }
    if (status === 'delivered') {
      updates.push('delivered_at = CURRENT_TIMESTAMP')
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(req.params.id)
    
    db.prepare(`UPDATE mall_orders SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    
    res.json({ success: true, message: 'Order status updated successfully' })
  } catch (e) {
    next(e)
  }
})

export default router

function parseOrderItems(rawItems: string | null) {
  if (!rawItems) return []
  try {
    const parsed = JSON.parse(rawItems)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeOrderPayload(data: any) {
  if (!data.service_id) return data

  const service = services.find((item) => item.id === Number(data.service_id))
  if (!service) {
    throw new Error('Service not found')
  }

  const quantity = Math.max(1, Number(data.quantity || 1))
  const owner = db.prepare('SELECT id, address_en, address_zh FROM owners ORDER BY id ASC LIMIT 1').get() as any
  const property = data.property_id
    ? db.prepare('SELECT address_en, address_zh FROM properties WHERE id = ?').get(data.property_id) as any
    : null

  return {
    owner_id: data.owner_id || owner?.id || 1,
    order_type: 'service',
    items: [{
      service_id: service.id,
      name: service.name,
      name_en: service.name_en,
      quantity,
      unit_price: service.price,
      provider: service.provider,
    }],
    total_amount: service.price * quantity,
    currency: 'AUD',
    payment_method: data.payment_method || 'demo_balance',
    payment_status: data.payment_status || 'paid',
    shipping_address: data.shipping_address || property?.address_zh || property?.address_en || owner?.address_zh || owner?.address_en || '',
    status: data.status || 'confirmed',
    ordered_at: new Date().toISOString(),
    paid_at: new Date().toISOString(),
    notes: data.notes || `${service.name} x${quantity}`,
  }
}
