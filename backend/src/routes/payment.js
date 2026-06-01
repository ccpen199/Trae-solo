const express = require('express')
const { db } = require('../database')
const router = express.Router()

router.post('/:id/execute', (req, res) => {
  const applicationId = req.params.id
  const { batch_no, operator } = req.body

  if (!batch_no) {
    return res.status(400).json({ error: '缺少批次号' })
  }

  if (operator) {
    const userStmt = db.prepare('SELECT role FROM users WHERE name = ?')
    const user = userStmt.get(operator)
    if (user && user.role !== 'finance' && user.role !== 'admin') {
      return res.status(403).json({ error: '只有财务角色可以执行支付操作' })
    }
  }

  const appStmt = db.prepare(`
    SELECT a.*, p.available_balance 
    FROM applications a 
    LEFT JOIN projects p ON a.project_id = p.id 
    WHERE a.id = ?
  `)
  const application = appStmt.get(applicationId)
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' })
  }

  if (application.status !== 'approved') {
    return res.status(400).json({ error: '申请未通过审批，不能支付' })
  }

  if (parseFloat(application.amount) > parseFloat(application.available_balance)) {
    return res.status(400).json({ error: '余额不足' })
  }

  const insertReceipt = db.prepare(`
    INSERT INTO payment_receipts (application_id, batch_no, status)
    VALUES (?, ?, 'processing')
  `)
  const result = insertReceipt.run(applicationId, batch_no)

  const success = Math.random() > 0.2
  
  if (success) {
    const updateReceipt = db.prepare(`
      UPDATE payment_receipts 
      SET bank_result = 'success', status = 'success', paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateReceipt.run(result.lastInsertRowid)

    const updateProject = db.prepare(`
      UPDATE projects 
      SET available_balance = available_balance - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT project_id FROM applications WHERE id = ?)
    `)
    updateProject.run(application.amount, applicationId)

    const updateApp = db.prepare(`
      UPDATE applications 
      SET status = 'paid', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    updateApp.run(applicationId)

    res.json({ 
      message: '支付成功',
      batch_no: batch_no,
      status: 'success'
    })
  } else {
    const reasons = ['账户信息错误', '余额不足', '银行系统维护', '收款方信息不匹配']
    const failureReason = reasons[Math.floor(Math.random() * reasons.length)]
    
    const updateReceipt = db.prepare(`
      UPDATE payment_receipts 
      SET bank_result = 'failed', failure_reason = ?, status = 'failed'
      WHERE id = ?
    `)
    updateReceipt.run(failureReason, result.lastInsertRowid)

    res.json({ 
      message: '支付失败',
      batch_no: batch_no,
      status: 'failed',
      failure_reason: failureReason
    })
  }
})

router.post('/:id/retry', (req, res) => {
  const applicationId = req.params.id

  const receiptStmt = db.prepare(`
    SELECT * FROM payment_receipts 
    WHERE application_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `)
  const receipt = receiptStmt.get(applicationId)
  
  if (!receipt) {
    return res.status(404).json({ error: '支付记录不存在' })
  }

  if (receipt.status !== 'failed') {
    return res.status(400).json({ error: '只有失败的支付才能重发' })
  }

  const updateReceipt = db.prepare(`
    UPDATE payment_receipts 
    SET retry_count = retry_count + 1, status = 'processing', bank_result = NULL, failure_reason = NULL
    WHERE id = ?
  `)
  updateReceipt.run(receipt.id)

  const success = Math.random() > 0.1
  
  if (success) {
    const appStmt = db.prepare('SELECT * FROM applications WHERE id = ?')
    const application = appStmt.get(applicationId)

    db.prepare(`
      UPDATE payment_receipts 
      SET bank_result = 'success', status = 'success', paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(receipt.id)

    db.prepare(`
      UPDATE projects 
      SET available_balance = available_balance - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT project_id FROM applications WHERE id = ?)
    `).run(application.amount, applicationId)

    db.prepare(`
      UPDATE applications 
      SET status = 'paid', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(applicationId)

    res.json({ 
      message: '重发支付成功',
      status: 'success'
    })
  } else {
    db.prepare(`
      UPDATE payment_receipts 
      SET bank_result = 'failed', failure_reason = '再次支付失败', status = 'failed'
      WHERE id = ?
    `).run(receipt.id)

    res.json({ 
      message: '重发支付失败',
      status: 'failed'
    })
  }
})

router.get('/receipts', (req, res) => {
  const stmt = db.prepare(`
    SELECT pr.*, a.applicant, a.amount, p.project_unit
    FROM payment_receipts pr
    LEFT JOIN applications a ON pr.application_id = a.id
    LEFT JOIN projects p ON a.project_id = p.id
    ORDER BY pr.created_at DESC
  `)
  const receipts = stmt.all()
  res.json(receipts)
})

router.get('/performance', (req, res) => {
  const stmt = db.prepare(`
    SELECT 
      p.id as project_id,
      p.project_unit,
      p.purpose,
      p.budget_source,
      p.annual_quota,
      p.available_balance,
      (p.annual_quota - p.available_balance) as used_amount,
      ROUND(((p.annual_quota - p.available_balance) / p.annual_quota) * 100, 2) as usage_rate,
      COUNT(DISTINCT a.id) as application_count,
      COUNT(DISTINCT CASE WHEN a.status = 'paid' THEN a.id END) as paid_count,
      SUM(CASE WHEN a.status = 'paid' THEN a.amount ELSE 0 END) as total_paid
    FROM projects p
    LEFT JOIN applications a ON p.id = a.project_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `)
  const performance = stmt.all()
  res.json(performance)
})

router.get('/performance/:project_id', (req, res) => {
  const projectId = req.params.project_id

  const projectStmt = db.prepare('SELECT * FROM projects WHERE id = ?')
  const project = projectStmt.get(projectId)
  
  if (!project) {
    return res.status(404).json({ error: '项目不存在' })
  }

  const appStmt = db.prepare(`
    SELECT 
      a.*,
      pr.batch_no,
      pr.bank_result,
      pr.paid_at
    FROM applications a
    LEFT JOIN payment_receipts pr ON a.id = pr.application_id
    WHERE a.project_id = ?
    ORDER BY a.created_at DESC
  `)
  const applications = appStmt.all(projectId)

  const auditStmt = db.prepare(`
    SELECT ar.*, a.applicant
    FROM audit_records ar
    LEFT JOIN applications a ON ar.application_id = a.id
    WHERE a.project_id = ?
    ORDER BY ar.created_at ASC
  `)
  const auditHistory = auditStmt.all(projectId)

  res.json({
    project,
    applications,
    audit_history: auditHistory,
    summary: {
      total_applications: applications.length,
      total_amount: applications.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0),
      paid_amount: applications.filter(a => a.status === 'paid').reduce((sum, a) => sum + parseFloat(a.amount || 0), 0),
      pending_count: applications.filter(a => a.status === 'pending').length,
      paid_count: applications.filter(a => a.status === 'paid').length
    }
  })
})

module.exports = router
