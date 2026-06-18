import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

const STATUS_FLOW: Record<string, string> = {
  submitted: 'reviewing',
  reviewing: 'approved',
  approved: 'completed',
}

router.post('/unemployment', auth, (req: Request, res: Response): void => {
  const { reason, bankAccount, bankName, attachments } = req.body
  if (!reason || !bankAccount || !bankName) {
    res.status(400).json({ ok: false, error: '缺少必要字段' })
    return
  }

  const db = getDb()
  const userId = req.user!.userId
  const formData = JSON.stringify({ reason, bankAccount, bankName, attachments: attachments || [] })

  const result = db.prepare(
    'INSERT INTO applications (user_id, type, status, form_data) VALUES (?, ?, ?, ?)'
  ).run(userId, 'unemployment', 'submitted', formData)

  const appId = result.lastInsertRowid

  const steps = [
    { step_name: '提交申请', status: 'done' },
    { step_name: '材料审核', status: 'pending' },
    { step_name: '审批决定', status: 'pending' },
    { step_name: '办结', status: 'pending' },
  ]
  const insertStep = db.prepare(
    'INSERT INTO status_steps (application_id, step_name, status) VALUES (?, ?, ?)'
  )
  for (const step of steps) {
    insertStep.run(appId, step.step_name, step.status)
  }

  db.prepare(
    'INSERT INTO business_records (user_id, business_type, business_id, action, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, 'unemployment', appId, 'create', '提交失业金申领申请')

  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId)
  res.json({ ok: true, application })
})

router.get('/unemployment', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const applications = db.prepare(
    "SELECT * FROM applications WHERE user_id = ? AND type = 'unemployment' ORDER BY created_at DESC"
  ).all(req.user!.userId)
  res.json({ ok: true, applications })
})

router.get('/unemployment/:id', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const application = db.prepare(
    "SELECT * FROM applications WHERE id = ? AND user_id = ? AND type = 'unemployment'"
  ).get(req.params.id, req.user!.userId) as any

  if (!application) {
    res.status(404).json({ ok: false, error: '申请不存在' })
    return
  }

  const steps = db.prepare(
    'SELECT * FROM status_steps WHERE application_id = ? ORDER BY id'
  ).all(application.id)

  res.json({ ok: true, application, steps })
})

router.post('/unemployment/:id/advance', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const application = db.prepare(
    "SELECT * FROM applications WHERE id = ? AND user_id = ? AND type = 'unemployment'"
  ).get(req.params.id, req.user!.userId) as any

  if (!application) {
    res.status(404).json({ ok: false, error: '申请不存在' })
    return
  }

  const { reject } = req.body
  let newStatus: string

  if (reject) {
    newStatus = 'rejected'
  } else {
    newStatus = STATUS_FLOW[application.status]
    if (!newStatus) {
      res.status(400).json({ ok: false, error: '无法继续推进状态' })
      return
    }
  }

  db.prepare(
    'UPDATE applications SET status = ?, updated_at = datetime("now") WHERE id = ?'
  ).run(newStatus, application.id)

  const currentStep = db.prepare(
    "SELECT * FROM status_steps WHERE application_id = ? AND status = 'pending' ORDER BY id LIMIT 1"
  ).get(application.id) as any

  if (currentStep) {
    db.prepare(
      'UPDATE status_steps SET status = ?, operator = ? WHERE id = ?'
    ).run(reject ? 'rejected' : 'done', req.user!.role, currentStep.id)

    if (!reject) {
      const nextStep = db.prepare(
        "SELECT * FROM status_steps WHERE application_id = ? AND status = 'pending' ORDER BY id LIMIT 1"
      ).get(application.id) as any

      if (nextStep) {
        db.prepare(
          "UPDATE status_steps SET status = 'active' WHERE id = ?"
        ).run(nextStep.id)
      }
    }
  }

  db.prepare(
    'INSERT INTO business_records (user_id, business_type, business_id, action, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user!.userId, 'unemployment', application.id, 'advance', `状态变更为${newStatus}`)

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(application.id)
  res.json({ ok: true, application: updated })
})

export default router
