import { Router } from 'express'
import { mockMerchants, mockAuditRecords, mockSettlementConfigs } from '../../shared/data.js'

const router = Router()

router.get('/list', (_req, res) => {
  res.json(mockMerchants)
})

router.get('/audit', (_req, res) => {
  const merchants = mockMerchants.filter(m => m.auditStatus !== 'active' && m.auditStatus !== 'rejected')
  res.json(merchants)
})

router.get('/audit-records', (_req, res) => {
  res.json(mockAuditRecords)
})

router.get('/rules', (_req, res) => {
  const rules = [
    { from: '成都', to: '宜宾', ratio: 1.2, enabled: true },
    { from: '成都', to: '绵阳', ratio: 1.1, enabled: true },
    { from: '成都', to: '乐山', ratio: 1.15, enabled: false },
    { from: '宜宾', to: '成都', ratio: 1.0, enabled: true },
    { from: '绵阳', to: '成都', ratio: 1.0, enabled: true },
    { from: '泸州', to: '宜宾', ratio: 1.1, enabled: true },
  ]
  res.json(rules)
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

export default router
