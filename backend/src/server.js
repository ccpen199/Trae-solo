require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('./database')

const app = express()
const PORT = process.env.BACKEND_PORT || 58886

const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48886}`,
  credentials: true
}))
app.use(bodyParser.json())
app.use('/uploads', express.static(uploadDir))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/projects', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  res.json(projects)
})

app.get('/api/projects/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) {
    return res.status(404).json({ error: '项目不存在' })
  }
  res.json(project)
})

app.post('/api/projects', (req, res) => {
  const { project_no, name, source, principal, department, start_date, end_date, total_budget } = req.body
  
  try {
    const stmt = db.prepare(`
      INSERT INTO projects (project_no, name, source, principal, department, start_date, end_date, total_budget)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(project_no, name, source, principal, department, start_date, end_date, total_budget)
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/projects/:id', (req, res) => {
  const { project_no, name, source, principal, department, start_date, end_date, total_budget, status } = req.body
  
  try {
    const stmt = db.prepare(`
      UPDATE projects 
      SET project_no = ?, name = ?, source = ?, principal = ?, department = ?, 
          start_date = ?, end_date = ?, total_budget = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    stmt.run(project_no, name, source, principal, department, start_date, end_date, total_budget, status, req.params.id)
    res.json({ id: req.params.id, ...req.body })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/projects/:id/budget', (req, res) => {
  const budgetItems = db.prepare(`
    SELECT *, 
           (budget_amount - used_amount - frozen_amount) as available_amount
    FROM budget_items 
    WHERE project_id = ?
  `).all(req.params.id)
  res.json(budgetItems)
})

app.post('/api/budget/adjust', (req, res) => {
  const { project_id, budget_item_id, new_amount, reason, approver } = req.body
  
  const item = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(budget_item_id)
  if (!item) {
    return res.status(404).json({ error: '预算科目不存在' })
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id)
  if (project && new Date() > new Date(project.end_date)) {
    return res.status(400).json({ error: '项目已超期，无法调整预算' })
  }

  try {
    db.prepare('BEGIN').run()
    
    const adjustStmt = db.prepare(`
      INSERT INTO budget_adjustments (project_id, budget_item_id, old_amount, new_amount, reason, approver, status)
      VALUES (?, ?, ?, ?, ?, ?, 'approved')
    `)
    adjustStmt.run(project_id, budget_item_id, item.budget_amount, new_amount, reason, approver)
    
    const updateStmt = db.prepare(`
      UPDATE budget_items 
      SET budget_amount = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateStmt.run(new_amount, budget_item_id)
    
    db.prepare('COMMIT').run()
    res.json({ success: true })
  } catch (err) {
    db.prepare('ROLLBACK').run()
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/budget/adjustments', (req, res) => {
  const { project_id } = req.query
  let sql = `
    SELECT ba.*, b.subject_name, p.name as project_name
    FROM budget_adjustments ba
    LEFT JOIN budget_items b ON ba.budget_item_id = b.id
    LEFT JOIN projects p ON ba.project_id = p.id
  `
  let params = []
  if (project_id) {
    sql += ' WHERE ba.project_id = ?'
    params.push(project_id)
  }
  sql += ' ORDER BY ba.created_at DESC'
  const adjustments = db.prepare(sql).all(...params)
  res.json(adjustments)
})

app.put('/api/budget/adjustments/:id/approve', (req, res) => {
  const { status } = req.body
  try {
    const stmt = db.prepare(`
      UPDATE budget_adjustments SET status = ? WHERE id = ?
    `)
    stmt.run(status, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/contracts', (req, res) => {
  const { project_id } = req.query
  let sql = 'SELECT * FROM contracts'
  let params = []
  if (project_id) {
    sql += ' WHERE project_id = ?'
    params.push(project_id)
  }
  sql += ' ORDER BY created_at DESC'
  const contracts = db.prepare(sql).all(...params)
  res.json(contracts)
})

app.post('/api/contracts', (req, res) => {
  const { project_id, contract_no, name, party_a, party_b, amount, sign_date } = req.body
  try {
    const stmt = db.prepare(`
      INSERT INTO contracts (project_id, contract_no, name, party_a, party_b, amount, sign_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(project_id, contract_no, name, party_a, party_b, amount, sign_date)
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/reimbursements', (req, res) => {
  const { project_id } = req.query
  let sql = `
    SELECT r.*, p.name as project_name, b.subject_name 
    FROM reimbursements r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN budget_items b ON r.budget_item_id = b.id
  `
  let params = []
  if (project_id) {
    sql += ' WHERE r.project_id = ?'
    params.push(project_id)
  }
  sql += ' ORDER BY r.created_at DESC'
  const reimbursements = db.prepare(sql).all(...params)
  res.json(reimbursements)
})

app.post('/api/reimbursements', (req, res) => {
  const { project_id, budget_item_id, contract_id, reimbursement_no, applicant, amount, description, invoice_count, has_acceptance } = req.body
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id)
  if (project && new Date() > new Date(project.end_date)) {
    return res.status(400).json({ error: '项目已超期，无法提交报销' })
  }

  if (invoice_count < 1) {
    return res.status(400).json({ error: '缺少发票附件，无法提交报销' })
  }

  const budget = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(budget_item_id)
  if (budget) {
    const available = budget.budget_amount - budget.used_amount - budget.frozen_amount
    if (amount > available) {
      return res.status(400).json({ error: '预算不足，无法提交报销' })
    }
  }

  try {
    db.prepare('BEGIN').run()
    
    const stmt = db.prepare(`
      INSERT INTO reimbursements (project_id, budget_item_id, contract_id, reimbursement_no, applicant, amount, description, invoice_count, has_acceptance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(project_id, budget_item_id, contract_id, reimbursement_no, applicant, amount, description, invoice_count, has_acceptance ? 1 : 0)
    
    if (budget) {
      db.prepare('UPDATE budget_items SET used_amount = used_amount + ? WHERE id = ?').run(amount, budget_item_id)
    }
    
    db.prepare('COMMIT').run()
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    db.prepare('ROLLBACK').run()
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/reimbursements/:id/approve', (req, res) => {
  const { approver, status } = req.body
  try {
    const stmt = db.prepare(`
      UPDATE reimbursements SET approver = ?, status = ? WHERE id = ?
    `)
    stmt.run(approver, status, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/purchases', (req, res) => {
  const { project_id } = req.query
  let sql = `
    SELECT pu.*, p.name as project_name, b.subject_name 
    FROM purchases pu
    LEFT JOIN projects p ON pu.project_id = p.id
    LEFT JOIN budget_items b ON pu.budget_item_id = b.id
  `
  let params = []
  if (project_id) {
    sql += ' WHERE pu.project_id = ?'
    params.push(project_id)
  }
  sql += ' ORDER BY pu.created_at DESC'
  const purchases = db.prepare(sql).all(...params)
  res.json(purchases)
})

app.post('/api/purchases', (req, res) => {
  const { project_id, budget_item_id, contract_id, purchase_no, applicant, item_name, quantity, unit_price, total_amount, has_acceptance } = req.body
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id)
  if (project && new Date() > new Date(project.end_date)) {
    return res.status(400).json({ error: '项目已超期，无法提交采购' })
  }

  const budget = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(budget_item_id)
  if (budget) {
    const available = budget.budget_amount - budget.used_amount - budget.frozen_amount
    if (total_amount > available) {
      return res.status(400).json({ error: '预算不足，无法提交采购' })
    }
  }

  try {
    db.prepare('BEGIN').run()
    
    const stmt = db.prepare(`
      INSERT INTO purchases (project_id, budget_item_id, contract_id, purchase_no, applicant, item_name, quantity, unit_price, total_amount, has_acceptance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(project_id, budget_item_id, contract_id, purchase_no, applicant, item_name, quantity, unit_price, total_amount, has_acceptance ? 1 : 0)
    
    if (budget) {
      db.prepare('UPDATE budget_items SET used_amount = used_amount + ? WHERE id = ?').run(total_amount, budget_item_id)
    }
    
    db.prepare('COMMIT').run()
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    db.prepare('ROLLBACK').run()
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/purchases/:id/approve', (req, res) => {
  const { approver, status } = req.body
  try {
    const stmt = db.prepare(`
      UPDATE purchases SET approver = ?, status = ? WHERE id = ?
    `)
    stmt.run(approver, status, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/fund-receipts', (req, res) => {
  const { project_id } = req.query
  let sql = `
    SELECT fr.*, p.name as project_name 
    FROM fund_receipts fr
    LEFT JOIN projects p ON fr.project_id = p.id
  `
  let params = []
  if (project_id) {
    sql += ' WHERE fr.project_id = ?'
    params.push(project_id)
  }
  sql += ' ORDER BY fr.created_at DESC'
  const receipts = db.prepare(sql).all(...params)
  res.json(receipts)
})

app.post('/api/fund-receipts', (req, res) => {
  const { project_id, receipt_no, batch_no, amount, matching_funds, receipt_date, source, remark } = req.body
  try {
    const stmt = db.prepare(`
      INSERT INTO fund_receipts (project_id, receipt_no, batch_no, amount, matching_funds, receipt_date, source, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(project_id, receipt_no, batch_no, amount, matching_funds, receipt_date, source, remark)
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/project-completions', (req, res) => {
  const completions = db.prepare(`
    SELECT pc.*, p.name as project_name, p.project_no, p.principal
    FROM project_completions pc
    LEFT JOIN projects p ON pc.project_id = p.id
    ORDER BY pc.created_at DESC
  `).all()
  res.json(completions)
})

app.post('/api/project-completions', (req, res) => {
  const { project_id, completion_date, remaining_funds, materials, audit_opinion, status } = req.body
  try {
    const stmt = db.prepare(`
      INSERT INTO project_completions (project_id, completion_date, remaining_funds, materials, audit_opinion, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(project_id, completion_date, remaining_funds, materials, audit_opinion, status)
    
    db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('completed', project_id)
    
    res.json({ id: result.lastInsertRowid, ...req.body })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/project-completions/:id/approve', (req, res) => {
  const { audit_opinion, status } = req.body
  try {
    const stmt = db.prepare(`
      UPDATE project_completions SET audit_opinion = ?, status = ? WHERE id = ?
    `)
    stmt.run(audit_opinion, status, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/dashboard/stats', (req, res) => {
  const stats = {}
  
  stats.total_projects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count
  stats.active_projects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").get().count
  stats.total_budget = db.prepare('SELECT SUM(total_budget) as total FROM projects').get().total || 0
  stats.total_receipts = db.prepare('SELECT SUM(amount) as total FROM fund_receipts').get().total || 0
  
  stats.overdue_projects = db.prepare(`
    SELECT COUNT(*) as count FROM projects 
    WHERE status = 'active' AND end_date < DATE('now')
  `).get().count
  
  stats.pending_approvals = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM reimbursements WHERE status = 'pending') +
      (SELECT COUNT(*) FROM purchases WHERE status = 'pending') +
      (SELECT COUNT(*) FROM budget_adjustments WHERE status = 'pending') as count
  `).get().count
  
  res.json(stats)
})

app.get('/api/dashboard/overdue-projects', (req, res) => {
  const projects = db.prepare(`
    SELECT * FROM projects 
    WHERE status = 'active' AND end_date < DATE('now')
    ORDER BY end_date ASC
  `).all()
  res.json(projects)
})

app.post('/api/upload', upload.single('file'), (req, res) => {
  const { business_type, business_id, uploader } = req.body
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' })
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO attachments (business_type, business_id, file_name, file_path, file_size, file_type, uploader)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      business_type,
      business_id,
      req.file.originalname,
      req.file.filename,
      req.file.size,
      req.file.mimetype,
      uploader
    )
    res.json({
      id: result.lastInsertRowid,
      file_name: req.file.originalname,
      file_path: req.file.filename,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      url: `http://127.0.0.1:${PORT}/uploads/${req.file.filename}`
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/attachments', (req, res) => {
  const { business_type, business_id } = req.query
  let sql = 'SELECT * FROM attachments'
  let params = []
  if (business_type && business_id) {
    sql += ' WHERE business_type = ? AND business_id = ?'
    params.push(business_type, business_id)
  }
  sql += ' ORDER BY created_at DESC'
  const attachments = db.prepare(sql).all(...params)
  const result = attachments.map(att => ({
    ...att,
    url: `http://127.0.0.1:${PORT}/uploads/${att.file_path}`
  }))
  res.json(result)
})

app.delete('/api/attachments/:id', (req, res) => {
  try {
    const att = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id)
    if (att) {
      const filePath = path.join(uploadDir, att.file_path)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id)
    }
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`)
})
