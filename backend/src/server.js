require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const dayjs = require('dayjs')
const path = require('path')
const db = require('./database')

const app = express()
const PORT = parseInt(process.env.FRONTEND_PORT) || 49951

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../../frontend/dist')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/dashboard', (req, res) => {
  const totalResources = db.prepare('SELECT COUNT(*) as count FROM resources').get().count
  const availableResources = db.prepare("SELECT COUNT(*) as count FROM resources WHERE status = 'available'").get().count
  const maintenanceResources = db.prepare("SELECT COUNT(*) as count FROM resources WHERE status = 'maintenance'").get().count
  
  const totalMembers = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'active'").get().count
  const totalContracts = db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status = 'active'").get().count
  
  const todayStart = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss')
  const todayEnd = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')
  const todayBookings = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE start_time >= ? AND start_time <= ? AND status = 'confirmed'
  `).get(todayStart, todayEnd).count
  
  const pendingBills = db.prepare("SELECT COUNT(*) as count FROM bills WHERE status IN ('unpaid', 'partial')").get().count
  const pendingAmount = db.prepare("SELECT COALESCE(SUM(total_amount - paid_amount), 0) as amount FROM bills WHERE status IN ('unpaid', 'partial')").get().amount
  
  const expiringContracts = db.prepare(`
    SELECT COUNT(*) as count FROM contracts 
    WHERE status = 'active' AND end_date <= ?
  `).get(dayjs().add(30, 'day').format('YYYY-MM-DD')).count
  
  const monthlyRevenue = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as amount FROM payments 
    WHERE payment_date >= ?
  `).get(dayjs().startOf('month').format('YYYY-MM-DD')).amount
  
  res.json({
    totalResources,
    availableResources,
    maintenanceResources,
    totalMembers,
    totalContracts,
    todayBookings,
    pendingBills,
    pendingAmount,
    expiringContracts,
    monthlyRevenue
  })
})

app.get('/api/floors', (req, res) => {
  const floors = db.prepare('SELECT * FROM floors ORDER BY name').all()
  res.json(floors)
})

app.get('/api/resources', (req, res) => {
  const { type, floor_id, status } = req.query
  let sql = `
    SELECT r.*, f.name as floor_name 
    FROM resources r 
    LEFT JOIN floors f ON r.floor_id = f.id 
    WHERE 1=1
  `
  const params = []
  
  if (type) {
    sql += " AND r.type = ?"
    params.push(type)
  }
  if (floor_id) {
    sql += " AND r.floor_id = ?"
    params.push(floor_id)
  }
  if (status) {
    sql += " AND r.status = ?"
    params.push(status)
  }
  
  sql += " ORDER BY r.type, r.name"
  
  const resources = db.prepare(sql).all(...params)
  res.json(resources)
})

app.post('/api/resources', (req, res) => {
  const { type, name, floor_id, capacity, price_hourly, price_daily, price_monthly, equipment, description } = req.body
  const result = db.prepare(`
    INSERT INTO resources (type, name, floor_id, capacity, price_hourly, price_daily, price_monthly, equipment, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(type, name, floor_id, capacity, price_hourly, price_daily, price_monthly, equipment, description)
  
  res.json({ id: result.lastInsertRowid, ...req.body })
})

app.put('/api/resources/:id', (req, res) => {
  const { id } = req.params
  const { type, name, floor_id, capacity, price_hourly, price_daily, price_monthly, status, equipment, description } = req.body
  
  db.prepare(`
    UPDATE resources 
    SET type=?, name=?, floor_id=?, capacity=?, price_hourly=?, price_daily=?, price_monthly=?, status=?, equipment=?, description=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(type, name, floor_id, capacity, price_hourly, price_daily, price_monthly, status, equipment, description, id)
  
  res.json({ id, ...req.body })
})

app.get('/api/companies', (req, res) => {
  const companies = db.prepare('SELECT * FROM companies ORDER BY name').all()
  res.json(companies)
})

app.post('/api/companies', (req, res) => {
  const { name, contact_person, contact_phone, contact_email, address } = req.body
  const result = db.prepare(`
    INSERT INTO companies (name, contact_person, contact_phone, contact_email, address)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, contact_person, contact_phone, contact_email, address)
  
  res.json({ id: result.lastInsertRowid, ...req.body })
})

app.get('/api/members', (req, res) => {
  const members = db.prepare(`
    SELECT m.*, c.name as company_name 
    FROM members m 
    LEFT JOIN companies c ON m.company_id = c.id 
    ORDER BY m.name
  `).all()
  res.json(members)
})

app.post('/api/members', (req, res) => {
  const { company_id, name, phone, email } = req.body
  const result = db.prepare(`
    INSERT INTO members (company_id, name, phone, email)
    VALUES (?, ?, ?, ?)
  `).run(company_id, name, phone, email)
  
  res.json({ id: result.lastInsertRowid, ...req.body })
})

app.get('/api/contracts', (req, res) => {
  const contracts = db.prepare(`
    SELECT c.*, comp.name as company_name,
      CASE WHEN c.end_date <= DATE('now', '+30 days') THEN 1 ELSE 0 END as expiring_soon
    FROM contracts c 
    LEFT JOIN companies comp ON c.company_id = comp.id 
    ORDER BY c.created_at DESC
  `).all()
  res.json(contracts)
})

app.post('/api/contracts', (req, res) => {
  const { company_id, member_count, package_type, start_date, end_date, monthly_rent, deposit, benefits, invoice_info } = req.body
  const result = db.prepare(`
    INSERT INTO contracts (company_id, member_count, package_type, start_date, end_date, monthly_rent, deposit, benefits, invoice_info)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(company_id, member_count, package_type, start_date, end_date, monthly_rent, deposit, benefits, invoice_info)
  
  res.json({ id: result.lastInsertRowid, ...req.body })
})

app.put('/api/contracts/:id/renew', (req, res) => {
  const { id } = req.params
  const { end_date, monthly_rent } = req.body
  db.prepare(`
    UPDATE contracts 
    SET end_date=?, monthly_rent=?, status='active', renewal_reminder_sent=0, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(end_date, monthly_rent, id)
  
  res.json({ success: true })
})

app.get('/api/bookings', (req, res) => {
  const { resource_id, start_date, end_date } = req.query
  let sql = `
    SELECT b.*, r.name as resource_name, r.type as resource_type, m.name as member_name, comp.name as company_name
    FROM bookings b 
    LEFT JOIN resources r ON b.resource_id = r.id 
    LEFT JOIN members m ON b.member_id = m.id
    LEFT JOIN companies comp ON m.company_id = comp.id
    WHERE 1=1
  `
  const params = []
  
  if (resource_id) {
    sql += " AND b.resource_id = ?"
    params.push(resource_id)
  }
  if (start_date) {
    sql += " AND b.start_time >= ?"
    params.push(start_date)
  }
  if (end_date) {
    sql += " AND b.start_time <= ?"
    params.push(end_date)
  }
  
  sql += " ORDER BY b.start_time DESC"
  
  const bookings = db.prepare(sql).all(...params)
  res.json(bookings)
})

app.post('/api/bookings/check', (req, res) => {
  const { resource_id, start_time, end_time, exclude_booking_id } = req.body
  
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resource_id)
  if (!resource) {
    return res.status(400).json({ error: '资源不存在' })
  }
  if (resource.status === 'maintenance') {
    return res.status(400).json({ error: '资源正在维修中，无法预订' })
  }
  
  let conflictSql = `
    SELECT COUNT(*) as count FROM bookings 
    WHERE resource_id = ? AND status = 'confirmed'
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))
  `
  const conflictParams = [resource_id, end_time, start_time, end_time, start_time, start_time, end_time]
  
  if (exclude_booking_id) {
    conflictSql += " AND id != ?"
    conflictParams.push(exclude_booking_id)
  }
  
  const conflict = db.prepare(conflictSql).get(...conflictParams)
  if (conflict.count > 0) {
    return res.status(400).json({ error: '该时段已被预订' })
  }
  
  res.json({ available: true })
})

app.post('/api/bookings', (req, res) => {
  const { resource_id, member_id, title, start_time, end_time, attendees } = req.body
  
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resource_id)
  if (!resource) {
    return res.status(400).json({ error: '资源不存在' })
  }
  if (resource.status === 'maintenance') {
    return res.status(400).json({ error: '资源正在维修中，无法预订' })
  }
  if (attendees > resource.capacity) {
    return res.status(400).json({ error: `参会人数超过容量限制(${resource.capacity}人)` })
  }
  
  const member = db.prepare(`
    SELECT m.*, comp.id as company_id FROM members m 
    LEFT JOIN companies comp ON m.company_id = comp.id 
    WHERE m.id = ?
  `).get(member_id)
  
  if (member) {
    const hasUnpaid = db.prepare(`
      SELECT COUNT(*) as count FROM bills 
      WHERE company_id = ? AND status IN ('unpaid', 'overdue') AND total_amount - paid_amount > 0
    `).get(member.company_id)
    
    if (hasUnpaid.count > 0) {
      return res.status(400).json({ error: '该企业存在未结清账单，请先缴费后再预订' })
    }
  }
  
  const conflict = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE resource_id = ? AND status = 'confirmed'
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))
  `).get(resource_id, end_time, start_time, end_time, start_time, start_time, end_time)
  
  if (conflict.count > 0) {
    return res.status(400).json({ error: '该时段已被预订' })
  }
  
  const result = db.prepare(`
    INSERT INTO bookings (resource_id, member_id, title, start_time, end_time, attendees)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(resource_id, member_id, title, start_time, end_time, attendees)
  
  res.json({ id: result.lastInsertRowid, ...req.body })
})

app.put('/api/bookings/:id/cancel', (req, res) => {
  const { id } = req.params
  const { reason } = req.body
  db.prepare(`
    UPDATE bookings 
    SET status='cancelled', cancelled_at=CURRENT_TIMESTAMP, cancelled_reason=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(reason || '用户取消', id)
  
  res.json({ success: true })
})

app.put('/api/bookings/:id/checkout', (req, res) => {
  const { id } = req.params
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id)
  
  const actualEndTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const scheduledEndTime = dayjs(booking.end_time)
  const isOverdue = dayjs(actualEndTime).isAfter(scheduledEndTime)
  
  db.prepare(`
    UPDATE bookings 
    SET status='completed', actual_end_time=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(actualEndTime, id)
  
  res.json({ success: true, isOverdue, actualEndTime })
})

app.get('/api/bills', (req, res) => {
  const { company_id, status } = req.query
  let sql = `
    SELECT b.*, comp.name as company_name,
      CASE WHEN b.due_date < DATE('now') AND b.status IN ('unpaid', 'partial') THEN 'overdue' ELSE b.status END as display_status
    FROM bills b 
    LEFT JOIN companies comp ON b.company_id = comp.id 
    WHERE 1=1
  `
  const params = []
  
  if (company_id) {
    sql += " AND b.company_id = ?"
    params.push(company_id)
  }
  if (status) {
    sql += " AND b.status = ?"
    params.push(status)
  }
  
  sql += " ORDER BY b.created_at DESC"
  
  const bills = db.prepare(sql).all(...params)
  res.json(bills)
})

app.get('/api/bills/:id', (req, res) => {
  const { id } = req.params
  const bill = db.prepare(`
    SELECT b.*, comp.name as company_name FROM bills b 
    LEFT JOIN companies comp ON b.company_id = comp.id 
    WHERE b.id = ?
  `).get(id)
  
  if (!bill) {
    return res.status(404).json({ error: '账单不存在' })
  }
  
  const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY type').all(id)
  const payments = db.prepare('SELECT * FROM payments WHERE bill_id = ? ORDER BY created_at DESC').all(id)
  
  res.json({ ...bill, items, payments })
})

app.post('/api/bills', (req, res) => {
  const { company_id, contract_id, bill_date, due_date, items, remark } = req.body
  
  const billNo = 'BILL' + dayjs().format('YYYYMMDDHHmmss')
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  
  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO bills (company_id, contract_id, bill_no, bill_date, due_date, total_amount, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(company_id, contract_id, billNo, bill_date, due_date, totalAmount, remark)
    
    const billId = result.lastInsertRowid
    const itemStmt = db.prepare(`
      INSERT INTO bill_items (bill_id, type, description, quantity, unit_price, amount, reference_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    items.forEach(item => {
      itemStmt.run(billId, item.type, item.description, item.quantity, item.unit_price, item.amount, item.reference_id)
    })
    
    return billId
  })
  
  const billId = tx()
  res.json({ id: billId, bill_no: billNo, total_amount: totalAmount, ...req.body })
})

app.post('/api/bills/:id/pay', (req, res) => {
  const { id } = req.params
  const { amount, payment_method, transaction_no, remark } = req.body
  const paymentDate = dayjs().format('YYYY-MM-DD')
  
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO payments (bill_id, amount, payment_method, payment_date, transaction_no, remark)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, amount, payment_method, paymentDate, transaction_no, remark)
    
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id)
    const newPaidAmount = bill.paid_amount + amount
    let newStatus = bill.status
    
    if (newPaidAmount >= bill.total_amount) {
      newStatus = 'paid'
    } else if (newPaidAmount > 0) {
      newStatus = 'partial'
    }
    
    db.prepare(`
      UPDATE bills SET paid_amount=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).run(newPaidAmount, newStatus, id)
    
    return { newPaidAmount, newStatus }
  })
  
  const result = tx()
  res.json({ success: true, ...result })
})

app.get('/api/reports/monthly', (req, res) => {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const date = dayjs().subtract(i, 'month')
    const startDate = date.startOf('month').format('YYYY-MM-DD')
    const endDate = date.endOf('month').format('YYYY-MM-DD')
    
    const revenue = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as amount FROM payments 
      WHERE payment_date >= ? AND payment_date <= ?
    `).get(startDate, endDate).amount
    
    months.push({
      month: date.format('YYYY-MM'),
      revenue
    })
  }
  res.json(months)
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'))
  }
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`)
  console.log(`API available at http://127.0.0.1:${PORT}/api`)
})
