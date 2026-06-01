const express = require('express')
const { db } = require('../database')
const router = express.Router()

const STAGES = ['business', 'finance', 'leader']

router.post('/:id/approve', (req, res) => {
  const { stage, auditor, opinion } = req.body
  const applicationId = req.params.id

  if (!stage || !auditor) {
    return res.status(400).json({ error: '缺少必填字段' })
  }

  const appStmt = db.prepare('SELECT * FROM applications WHERE id = ?')
  const application = appStmt.get(applicationId)
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' })
  }

  if (application.current_stage !== stage) {
    return res.status(400).json({ 
      error: '当前不在此审核阶段',
      current_stage: application.current_stage
    })
  }

  const insertAudit = db.prepare(`
    INSERT INTO audit_records (application_id, stage, auditor, action, opinion)
    VALUES (?, ?, ?, 'approve', ?)
  `)
  insertAudit.run(applicationId, stage, auditor, opinion)

  const currentIndex = STAGES.indexOf(stage)
  
  if (currentIndex < STAGES.length - 1) {
    const nextStage = STAGES[currentIndex + 1]
    const update = db.prepare(`
      UPDATE applications 
      SET current_stage = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    update.run(nextStage, applicationId)
    
    res.json({ 
      message: stage === 'business' ? '业务审核通过' : stage === 'finance' ? '财务审核通过' : '审核通过',
      next_stage: nextStage,
      status: 'pending'
    })
  } else {
    const update = db.prepare(`
      UPDATE applications 
      SET current_stage = 'completed', status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    update.run(applicationId)
    
    res.json({ 
      message: '领导审批通过，进入支付环节',
      status: 'approved'
    })
  }
})

router.post('/:id/reject', (req, res) => {
  const { stage, auditor, opinion } = req.body
  const applicationId = req.params.id

  if (!stage || !auditor || !opinion) {
    return res.status(400).json({ error: '缺少必填字段' })
  }

  const appStmt = db.prepare('SELECT * FROM applications WHERE id = ?')
  const application = appStmt.get(applicationId)
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' })
  }

  const insertAudit = db.prepare(`
    INSERT INTO audit_records (application_id, stage, auditor, action, opinion)
    VALUES (?, ?, ?, 'reject', ?)
  `)
  insertAudit.run(applicationId, stage, auditor, opinion)

  const update = db.prepare(`
    UPDATE applications 
    SET status = 'rejected', current_stage = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  update.run(stage, applicationId)

  res.json({ 
    message: '申请已退回',
    status: 'rejected',
    stage: stage
  })
})

router.post('/:id/return', (req, res) => {
  const { stage, auditor, opinion, return_to } = req.body
  const applicationId = req.params.id

  if (!stage || !auditor || !opinion) {
    return res.status(400).json({ error: '缺少必填字段' })
  }

  const appStmt = db.prepare('SELECT * FROM applications WHERE id = ?')
  const application = appStmt.get(applicationId)
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' })
  }

  const insertAudit = db.prepare(`
    INSERT INTO audit_records (application_id, stage, auditor, action, opinion)
    VALUES (?, ?, ?, 'return', ?)
  `)
  insertAudit.run(applicationId, stage, auditor, opinion)

  const returnStage = return_to || 'business'
  
  const update = db.prepare(`
    UPDATE applications 
    SET status = 'correction', current_stage = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  update.run(returnStage, applicationId)

  res.json({ 
    message: '已退回补正',
    status: 'correction',
    return_to: returnStage
  })
})

router.get('/:id/history', (req, res) => {
  const stmt = db.prepare(`
    SELECT ar.*, a.applicant, a.amount
    FROM audit_records ar
    LEFT JOIN applications a ON ar.application_id = a.id
    WHERE ar.application_id = ?
    ORDER BY ar.created_at ASC
  `)
  const history = stmt.all(req.params.id)
  res.json(history)
})

module.exports = router
