import { Router } from 'express'
import db, { parseMerchants } from '../db'

const router = Router()

const rules = [
  { from: '成都', to: '宜宾', ratio: 1.2, enabled: true },
  { from: '成都', to: '绵阳', ratio: 1.1, enabled: true },
  { from: '成都', to: '乐山', ratio: 1.15, enabled: false },
  { from: '宜宾', to: '成都', ratio: 1.0, enabled: true },
  { from: '绵阳', to: '成都', ratio: 1.0, enabled: true },
  { from: '泸州', to: '宜宾', ratio: 1.1, enabled: true },
]

router.get('/list', (_req, res) => {
  const rows = db.prepare('SELECT * FROM merchants ORDER BY name').all()
  res.json(parseMerchants(rows as any))
})

router.get('/audit', (_req, res) => {
  const rows = db.prepare(`
    SELECT * FROM merchants
    WHERE auditStatus NOT IN ('active','rejected')
    ORDER BY auditStatus, name
  `).all()
  res.json(parseMerchants(rows as any))
})

router.patch('/audit/:id', (req, res) => {
  const { id } = req.params
  const { action } = req.body as { action: 'approve' | 'reject'; note?: string }
  const row = db.prepare('SELECT auditStatus FROM merchants WHERE id = ?').get(id) as { auditStatus: string } | undefined
  if (!row) { res.status(404).json({ error: 'Merchant not found' }); return }
  let nextStatus = row.auditStatus
  if (action === 'approve') {
    if (row.auditStatus === 'pending_ocr') nextStatus = 'pending_review'
    else if (row.auditStatus === 'pending_review') nextStatus = 'pending_deposit'
    else if (row.auditStatus === 'pending_deposit') nextStatus = 'active'
  } else if (action === 'reject') {
    nextStatus = 'rejected'
  }
  db.prepare('UPDATE merchants SET auditStatus = ? WHERE id = ?').run(nextStatus, id)
  const updated = db.prepare('SELECT * FROM merchants WHERE id = ?').get(id)
  const [merchant] = parseMerchants([updated] as any)
  res.json({ success: true, merchant })
})

router.get('/audit-records', (_req, res) => {
  const rows = db.prepare('SELECT * FROM audit_records ORDER BY datetime DESC').all()
  res.json(rows)
})

router.get('/rules', (_req, res) => {
  res.json(rules)
})

router.patch('/rules/:index', (req, res) => {
  const idx = parseInt(req.params.index, 10)
  if (isNaN(idx) || idx < 0 || idx >= rules.length) {
    res.status(400).json({ error: 'Invalid rule index' })
    return
  }
  const { ratio, enabled } = req.body as { ratio?: number; enabled?: boolean }
  if (ratio != null) {
    if (typeof ratio !== 'number' || ratio < 0.5 || ratio > 2.0) {
      res.status(400).json({ error: 'ratio must be between 0.5 and 2.0' })
      return
    }
    rules[idx].ratio = Math.round(ratio * 100) / 100
  }
  if (enabled != null) rules[idx].enabled = Boolean(enabled)
  res.json({ success: true, rule: rules[idx] })
})

router.get('/settlements', (_req, res) => {
  const rows = db.prepare(`
    SELECT sc.*, m.name AS merchantName
    FROM settlement_configs sc
    LEFT JOIN merchants m ON m.id = sc.merchantId
    ORDER BY sc.id
  `).all()
  res.json(rows)
})

router.patch('/settlements/:id', (req, res) => {
  const { id } = req.params
  const { cycle, minAmount } = req.body as { cycle?: string; minAmount?: number }
  const existing = db.prepare('SELECT * FROM settlement_configs WHERE id = ?').get(id)
  if (!existing) { res.status(404).json({ error: 'Settlement config not found' }); return }
  if (cycle && ['T+1', 'T+3', 'T+7'].includes(cycle)) {
    db.prepare('UPDATE settlement_configs SET cycle = ? WHERE id = ?').run(cycle, id)
  }
  if (minAmount != null) {
    if (typeof minAmount !== 'number' || minAmount < 0) {
      res.status(400).json({ error: 'minAmount must be a non-negative number' })
      return
    }
    db.prepare('UPDATE settlement_configs SET minAmount = ? WHERE id = ?').run(minAmount, id)
  }
  const updated = db.prepare(`
    SELECT sc.*, m.name AS merchantName
    FROM settlement_configs sc LEFT JOIN merchants m ON m.id = sc.merchantId
    WHERE sc.id = ?
  `).get(id)
  res.json({ success: true, config: updated })
})

export default router
