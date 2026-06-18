import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

const COMPLAINT_STATUS_FLOW: Record<string, string> = {
  submitted: 'accepted',
  accepted: 'investigating',
  investigating: 'resolved',
  resolved: 'closed',
}

router.post('/contract', auth, (req: Request, res: Response): void => {
  const { type, partyA, partyB, startDate, endDate, terms } = req.body
  if (!type || !partyA || !partyB || !startDate || !endDate || !terms) {
    res.status(400).json({ ok: false, error: '缺少必要字段' })
    return
  }

  const db = getDb()
  const userId = req.user!.userId

  const result = db.prepare(
    'INSERT INTO contracts (user_id, contract_type, party_a, party_b, start_date, end_date, terms) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, type, partyA, partyB, startDate, endDate, terms)

  const contractId = result.lastInsertRowid

  db.prepare(
    'INSERT INTO business_records (user_id, business_type, business_id, action, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'contract', contractId, 'create', '创建劳动合同')

  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId)
  res.json({ ok: true, contract })
})

router.get('/contract', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const contracts = db.prepare(
    'SELECT * FROM contracts WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user!.userId)
  res.json({ ok: true, contracts })
})

router.get('/contract/:id', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const contract = db.prepare(
    'SELECT * FROM contracts WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId)

  if (!contract) {
    res.status(404).json({ ok: false, error: '合同不存在' })
    return
  }

  res.json({ ok: true, contract })
})

router.post('/contract/:id/sign', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const contract = db.prepare(
    'SELECT * FROM contracts WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId) as any

  if (!contract) {
    res.status(404).json({ ok: false, error: '合同不存在' })
    return
  }

  const { signatureData, role } = req.body
  if (!signatureData || !role || !['employer', 'employee'].includes(role)) {
    res.status(400).json({ ok: false, error: '缺少签名数据或角色' })
    return
  }

  if (role === 'employer') {
    db.prepare(
      'UPDATE contracts SET employer_sign = ? WHERE id = ?'
    ).run(signatureData, contract.id)
  } else {
    db.prepare(
      'UPDATE contracts SET employee_sign = ? WHERE id = ?'
    ).run(signatureData, contract.id)
  }

  const updated = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contract.id) as any

  if (updated.employer_sign && updated.employee_sign) {
    db.prepare(
      "UPDATE contracts SET status = 'signed' WHERE id = ?"
    ).run(contract.id)

    db.prepare(
      'INSERT INTO business_records (user_id, business_type, business_id, action, detail) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.userId, 'contract', contract.id, 'sign', '双方签署完成')
  } else {
    db.prepare(
      'INSERT INTO business_records (user_id, business_type, business_id, action, detail) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.userId, 'contract', contract.id, 'sign', `${role === 'employer' ? '雇主' : '员工'}已签署`)
  }

  const finalContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contract.id)
  res.json({ ok: true, contract: finalContract })
})

router.post('/complaint', auth, (req: Request, res: Response): void => {
  const { target, subject, description, evidence } = req.body
  if (!target || !subject || !description) {
    res.status(400).json({ ok: false, error: '缺少必要字段' })
    return
  }

  const db = getDb()
  const userId = req.user!.userId

  const result = db.prepare(
    'INSERT INTO complaints (user_id, target, subject, description, evidence) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, target, subject, description, JSON.stringify(evidence || []))

  const complaintId = result.lastInsertRowid

  const steps = [
    { step_name: '提交投诉', status: 'done' },
    { step_name: '受理审核', status: 'pending' },
    { step_name: '调查处理', status: 'pending' },
    { step_name: '处理结果', status: 'pending' },
    { step_name: '结案', status: 'pending' },
  ]
  const insertStep = db.prepare(
    'INSERT INTO status_steps (application_id, step_name, status) VALUES (?, ?, ?)'
  )
  for (const step of steps) {
    insertStep.run(complaintId, step.step_name, step.status)
  }

  db.prepare(
    'INSERT INTO business_records (user_id, business_type, business_id, action, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'complaint', complaintId, 'create', '提交劳动监察投诉')

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId)
  res.json({ ok: true, complaint })
})

router.get('/complaint', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const complaints = db.prepare(
    'SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user!.userId)
  res.json({ ok: true, complaints })
})

router.get('/complaint/:id', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const complaint = db.prepare(
    'SELECT * FROM complaints WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId) as any

  if (!complaint) {
    res.status(404).json({ ok: false, error: '投诉不存在' })
    return
  }

  const steps = db.prepare(
    'SELECT * FROM status_steps WHERE application_id = ? ORDER BY id'
  ).all(complaint.id)

  res.json({ ok: true, complaint, steps })
})

router.post('/complaint/:id/advance', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const complaint = db.prepare(
    'SELECT * FROM complaints WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId) as any

  if (!complaint) {
    res.status(404).json({ ok: false, error: '投诉不存在' })
    return
  }

  const newStatus = COMPLAINT_STATUS_FLOW[complaint.status]
  if (!newStatus) {
    res.status(400).json({ ok: false, error: '无法继续推进状态' })
    return
  }

  db.prepare(
    'UPDATE complaints SET status = ?, updated_at = datetime("now") WHERE id = ?'
  ).run(newStatus, complaint.id)

  const currentStep = db.prepare(
    "SELECT * FROM status_steps WHERE application_id = ? AND status = 'pending' ORDER BY id LIMIT 1"
  ).get(complaint.id) as any

  if (currentStep) {
    db.prepare(
      'UPDATE status_steps SET status = ?, operator = ? WHERE id = ?'
    ).run('done', req.user!.role, currentStep.id)

    const nextStep = db.prepare(
      "SELECT * FROM status_steps WHERE application_id = ? AND status = 'pending' ORDER BY id LIMIT 1"
    ).get(complaint.id) as any

    if (nextStep) {
      db.prepare(
        "UPDATE status_steps SET status = 'active' WHERE id = ?"
      ).run(nextStep.id)
    }
  }

  db.prepare(
    'INSERT INTO business_records (user_id, business_type, business_id, action, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user!.userId, 'complaint', complaint.id, 'advance', `状态变更为${newStatus}`)

  const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id)
  res.json({ ok: true, complaint: updated })
})

export default router
