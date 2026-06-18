import { Router } from 'express'
import { mockMerchants, mockAuditRecords, mockSettlementConfigs } from '../../shared/data.js'

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
  res.json(mockMerchants)
})

router.get('/audit', (_req, res) => {
  const merchants = mockMerchants.filter(m => m.auditStatus !== 'active' && m.auditStatus !== 'rejected')
  res.json(merchants)
})

router.patch('/audit/:id', (req, res) => {
  const { id } = req.params
  const { action, note } = req.body as { action: 'approve' | 'reject'; note?: string }
  const merchant = mockMerchants.find(m => m.id === id)
  if (!merchant) {
    res.status(404).json({ error: 'Merchant not found' })
    return
  }
  if (action === 'approve') {
    if (merchant.auditStatus === 'pending_ocr') merchant.auditStatus = 'pending_review'
    else if (merchant.auditStatus === 'pending_review') merchant.auditStatus = 'pending_deposit'
    else if (merchant.auditStatus === 'pending_deposit') merchant.auditStatus = 'active'
  } else if (action === 'reject') {
    merchant.auditStatus = 'rejected'
  }
  res.json({ success: true, merchant })
})

router.get('/audit-records', (_req, res) => {
  res.json(mockAuditRecords)
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
  if (enabled != null) {
    rules[idx].enabled = Boolean(enabled)
  }
  res.json({ success: true, rule: rules[idx] })
})

router.get('/settlements', (_req, res) => {
  const settlements = mockSettlementConfigs.map(sc => {
    const merchant = mockMerchants.find(m => m.id === sc.merchantId)
    return {
      ...sc,
      merchantName: merchant?.name ?? '',
    }
  })
  res.json(settlements)
})

router.patch('/settlements/:id', (req, res) => {
  const { id } = req.params
  const { cycle, minAmount } = req.body as { cycle?: string; minAmount?: number }
  const config = mockSettlementConfigs.find(s => s.id === id)
  if (!config) {
    res.status(404).json({ error: 'Settlement config not found' })
    return
  }
  if (cycle && ['T+1', 'T+3', 'T+7'].includes(cycle)) {
    config.cycle = cycle as 'T+1' | 'T+3' | 'T+7'
  }
  if (minAmount != null) {
    if (typeof minAmount !== 'number' || minAmount < 0) {
      res.status(400).json({ error: 'minAmount must be a non-negative number' })
      return
    }
    config.minAmount = minAmount
  }
  const merchant = mockMerchants.find(m => m.id === config.merchantId)
  res.json({ success: true, config: { ...config, merchantName: merchant?.name ?? '' } })
})

export default router
