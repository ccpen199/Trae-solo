import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

function invCol(name: string, asName?: string): string {
  return name + (asName ? ' AS ' + asName : '')
}

router.get('/invoice-entities', authMiddleware, roleMiddleware('shipper', 'admin'), (req: Request, res: Response): void => {
  const shipperId = req.user!.role === 'shipper' ? req.user!.userId : undefined
  let entities: any[]
  if (shipperId) {
    entities = db.prepare('SELECT * FROM invoice_entities WHERE shipper_id = ? ORDER BY company_name').all(shipperId)
  } else {
    entities = db.prepare('SELECT * FROM invoice_entities ORDER BY company_name').all()
  }
  res.json({ success: true, list: entities })
})

router.post('/invoice-entities', authMiddleware, roleMiddleware('shipper'), (req: Request, res: Response): void => {
  const { company_name, tax_no, address, phone, bank_name, bank_account } = req.body
  const shipperId = req.user!.userId

  if (!company_name || !tax_no) {
    res.status(400).json({ success: false, error: '公司名称和税号为必填项' })
    return
  }

  const id = `ie_${uuidv4().substring(0, 8)}`
  db.prepare(`
    INSERT INTO invoice_entities (id, shipper_id, company_name, tax_no, address, phone, bank_name, bank_account)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, shipperId, company_name, tax_no, address || '', phone || '', bank_name || '', bank_account || '')

  const entity = db.prepare('SELECT * FROM invoice_entities WHERE id = ?').get(id)
  res.json({ success: true, data: entity })
})

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const status = req.query.status as string
  const userId = req.user!.userId
  const role = req.user!.role

  const offset = (page - 1) * pageSize
  const conditions: string[] = []
  const params: any[] = []

  if (role === 'shipper') {
    conditions.push('o.shipper_id = ?')
    params.push(userId)
  } else if (role === 'driver') {
    conditions.push('o.driver_id = ?')
    params.push(userId)
  }

  if (status) {
    conditions.push('i.status = ?')
    params.push(status)
  }

  const whereSql = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : ''

  const invCols = db.prepare('PRAGMA table_info(invoices)').all() as { name: string }[]
  const hasOldCols = invCols.some(c => c.name === 'seller_name')
  const hasIssuedAt = invCols.some(c => c.name === 'issued_at')
  const orderExpr = hasIssuedAt ? 'i.issued_at DESC, i.created_at DESC' : 'i.invoice_date DESC, i.created_at DESC'

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM invoices i
    LEFT JOIN orders o ON CAST(i.order_id AS TEXT) = o.id
    LEFT JOIN freights f ON o.freight_id = f.id
    ${whereSql}
  `).get(...params) as { count: number }

  const sellerFields = hasOldCols
    ? 'i.seller_name AS ie_company_name, i.seller_tax_no AS ie_tax_no, i.seller_address AS ie_address, i.seller_phone AS ie_phone, i.seller_bank AS ie_bank_name, i.seller_bank_account AS ie_bank_account, i.buyer_name AS buyer_name, i.buyer_tax_no AS buyer_tax_no, i.buyer_address AS buyer_address, i.buyer_phone AS buyer_phone, i.buyer_bank AS buyer_bank_name, i.buyer_bank_account AS buyer_bank_account, i.invoice_date, i.total_amount'
    : 'ie.company_name AS ie_company_name, ie.tax_no AS ie_tax_no, ie.address AS ie_address, ie.phone AS ie_phone, ie.bank_name AS ie_bank_name, ie.bank_account AS ie_bank_account, us.name AS buyer_name, sp.credit_code AS buyer_tax_no, sp.company_address AS buyer_address, sp.company_phone AS buyer_phone, sp.bank_name AS buyer_bank_name, sp.bank_account AS buyer_bank_account, i.issued_at AS invoice_date, i.amount AS total_amount'
  const issuedAtExpr = hasIssuedAt ? 'i.issued_at' : 'i.invoice_date'

  const list = db.prepare(`
    SELECT i.*, o.waybill_no, f.origin, f.destination,
      ie.company_name, ie.tax_no, ${sellerFields},
      ${issuedAtExpr} AS issued_at
    FROM invoices i
    LEFT JOIN orders o ON CAST(i.order_id AS TEXT) = o.id
    LEFT JOIN freights f ON o.freight_id = f.id
    LEFT JOIN invoice_entities ie ON i.invoice_entity_id = ie.id
    LEFT JOIN users us ON o.shipper_id = us.id
    LEFT JOIN shipper_profiles sp ON o.shipper_id = sp.user_id
    ${whereSql}
    ORDER BY ${orderExpr}
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  res.json({ success: true, list, total: total.count })
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  const invCols = db.prepare('PRAGMA table_info(invoices)').all() as { name: string }[]
  const hasOldCols = invCols.some(c => c.name === 'seller_name')
  const hasIssuedAt = invCols.some(c => c.name === 'issued_at')

  const sellerFields = hasOldCols
    ? 'i.seller_name AS ie_company_name, i.seller_tax_no AS ie_tax_no, i.seller_address AS ie_address, i.seller_phone AS ie_phone, i.seller_bank AS ie_bank_name, i.seller_bank_account AS ie_bank_account, i.buyer_name AS buyer_name, i.buyer_tax_no AS buyer_tax_no, i.buyer_address AS buyer_address, i.buyer_phone AS buyer_phone, i.buyer_bank AS buyer_bank_name, i.buyer_bank_account AS buyer_bank_account, i.invoice_date, i.total_amount'
    : 'ie.company_name AS ie_company_name, ie.tax_no AS ie_tax_no, ie.address AS ie_address, ie.phone AS ie_phone, ie.bank_name AS ie_bank_name, ie.bank_account AS ie_bank_account, us.name AS buyer_name, sp.credit_code AS buyer_tax_no, sp.company_address AS buyer_address, sp.company_phone AS buyer_phone, sp.bank_name AS buyer_bank_name, sp.bank_account AS buyer_bank_account, i.issued_at AS invoice_date, i.amount AS total_amount'
  const issuedAtExpr = hasIssuedAt ? 'i.issued_at' : 'i.invoice_date'

  const invoice = db.prepare(`
    SELECT i.*, o.waybill_no, f.origin, f.destination, o.total_fee,
      o.driver_id, o.shipper_id,
      ie.company_name, ie.tax_no, ie.address, ie.phone, ie.bank_name, ie.bank_account, ${sellerFields},
      ud.name as driver_name, us.name as shipper_name,
      ${issuedAtExpr} AS issued_at
    FROM invoices i
    LEFT JOIN orders o ON CAST(i.order_id AS TEXT) = o.id
    LEFT JOIN freights f ON o.freight_id = f.id
    LEFT JOIN invoice_entities ie ON i.invoice_entity_id = ie.id
    LEFT JOIN users ud ON o.driver_id = ud.id
    LEFT JOIN users us ON o.shipper_id = us.id
    LEFT JOIN shipper_profiles sp ON o.shipper_id = sp.user_id
    WHERE i.id = ?
  `).get(req.params.id)

  if (!invoice) {
    res.status(404).json({ success: false, error: '发票不存在' })
    return
  }

  res.json({ success: true, data: invoice })
})

router.post('/generate/:orderId', authMiddleware, roleMiddleware('shipper', 'admin'), (req: Request, res: Response): void => {
  const orderId = req.params.orderId

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) {
    res.status(404).json({ success: false, error: '运单不存在' })
    return
  }

  const freight = db.prepare('SELECT need_vat, invoice_entity_id FROM freights WHERE id = ?').get(order.freight_id) as any
  if (!freight || !freight.need_vat || !freight.invoice_entity_id) {
    res.status(400).json({ success: false, error: '该运单不需要专票或未指定开票主体' })
    return
  }

  const invCols = db.prepare('PRAGMA table_info(invoices)').all() as { name: string }[]
  const hasOldCols = invCols.some(c => c.name === 'seller_name')
  const existing = db.prepare('SELECT * FROM invoices WHERE CAST(order_id AS TEXT) = ?').get(orderId)
  if (existing) {
    res.json({ success: true, data: existing, message: '发票已存在' })
    return
  }

  const ie = db.prepare('SELECT * FROM invoice_entities WHERE id = ?').get(freight.invoice_entity_id) as any
  const shipper = db.prepare(`
    SELECT u.name, sp.company_name, sp.credit_code, sp.company_address, sp.company_phone, sp.bank_name, sp.bank_account
    FROM users u LEFT JOIN shipper_profiles sp ON u.id = sp.user_id WHERE u.id = ?
  `).get(order.shipper_id) as any

  const invoiceId = `inv_${uuidv4().substring(0, 8)}`
  const invoiceNo = Math.floor(10000000 + Math.random() * 90000000).toString()
  const invoiceCode = '011002600311'
  const taxRate = 0.09
  const amount = order.total_fee
  const taxAmount = Math.round(amount * taxRate * 100) / 100
  const totalAmount = Math.round((amount + taxAmount) * 100) / 100
  const now = new Date().toISOString()

  const insertCols: string[] = []
  const insertVals: any[] = []
  const insertPlaceholders: string[] = []

  function addCol(col: string, val: any) {
    if (invCols.some(c => c.name === col)) {
      insertCols.push(col)
      insertVals.push(val)
      insertPlaceholders.push('?')
    }
  }

  const idType = ((invCols.find(c => c.name === 'id') as { name: string; type: string } | undefined)?.type || '').toUpperCase()
  if (!/INT/i.test(idType)) {
    addCol('id', invoiceId)
  }

  addCol('order_id', /INT/i.test(idType) ? Number(orderId.replace(/\D/g, '') || 0) : orderId)
  addCol('invoice_no', invoiceNo)
  addCol('invoice_code', invoiceCode)
  addCol('amount', amount)
  addCol('tax_rate', taxRate)
  addCol('tax_amount', taxAmount)
  addCol('status', 'issued')
  addCol('invoice_entity_id', freight.invoice_entity_id)
  addCol('issued_at', now)
  addCol('invoice_date', now)

  if (hasOldCols) {
    addCol('seller_name', ie?.company_name || '')
    addCol('seller_tax_no', ie?.tax_no || '')
    addCol('seller_address', ie?.address || '')
    addCol('seller_phone', ie?.phone || '')
    addCol('seller_bank', ie?.bank_name || '')
    addCol('seller_bank_account', ie?.bank_account || '')
    addCol('buyer_name', shipper?.company_name || shipper?.name || '')
    addCol('buyer_tax_no', shipper?.credit_code || '')
    addCol('buyer_address', shipper?.company_address || '')
    addCol('buyer_phone', shipper?.company_phone || '')
    addCol('buyer_bank', shipper?.bank_name || '')
    addCol('buyer_bank_account', shipper?.bank_account || '')
    addCol('total_amount', totalAmount)
  }

  db.pragma('foreign_keys = OFF')
  const info = db.prepare(`INSERT INTO invoices (${insertCols.join(',')}) VALUES (${insertPlaceholders.join(',')})`).run(...insertVals)
  db.pragma('foreign_keys = ON')

  const lastId = info.lastInsertRowid
  const fetched = /INT/i.test(idType)
    ? db.prepare('SELECT * FROM invoices WHERE id = ?').get(lastId)
    : db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId)
  res.json({ success: true, data: fetched })
})

export default router
