import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const claims: Record<string, any> = {}

router.post('/', (req, res) => {
  const { waybillNo, damageType, damageDescription, damagePhotos = [], repairInvoices = [], claimAmount } = req.body

  if (!waybillNo || !damageType || !claimAmount) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }

  const claimId = 'CLM' + Date.now()

  const ocrResult = {
    waybillNo,
    senderName: '张伟',
    senderPhone: '138****6688',
    receiverName: '李明',
    receiverPhone: '139****8899',
    cargoName: '精密数控机床',
    cargoQuantity: 1,
    declaredValue: 280000,
    freight: 5280,
    confidence: 0.96
  }

  const claim = {
    id: claimId,
    waybillNo,
    damageType,
    damageDescription: damageDescription || '',
    damagePhotos,
    repairInvoices,
    claimAmount,
    approvedAmount: null,
    status: 'submitted',
    createdAt: new Date().toISOString(),
    ocrResult
  }

  claims[claimId] = claim

  res.status(201).json({
    code: 201,
    message: 'success',
    data: { claimId, status: 'submitted', ocrResult }
  })
})

router.get('/:claimId', (req, res) => {
  const claim = claims[req.params.claimId]
  if (claim) {
    return res.json({ code: 200, data: claim })
  }
  res.json({
    code: 200,
    data: {
      id: req.params.claimId,
      waybillNo: 'DB2026061100001',
      damageType: '外包装破损',
      damageDescription: '木箱右下角有明显裂痕',
      status: 'submitted',
      claimAmount: 15800,
      ocrResult: {
        waybillNo: 'DB2026061100001',
        senderName: '张伟',
        senderPhone: '138****6688',
        receiverName: '李明',
        receiverPhone: '139****8899',
        cargoName: '精密数控机床',
        cargoQuantity: 1,
        declaredValue: 280000,
        freight: 5280,
        confidence: 0.96
      }
    }
  })
})

router.put('/:claimId/approve', (req, res) => {
  const { approvedAmount, reviewComment } = req.body
  const claim = claims[req.params.claimId]
  if (claim) {
    claim.status = 'approved'
    claim.approvedAmount = approvedAmount || claim.claimAmount
    claim.reviewComment = reviewComment
    return res.json({ code: 200, data: claim })
  }
  res.json({ code: 200, data: { id: req.params.claimId, status: 'approved', approvedAmount: approvedAmount || 15800 } })
})

router.put('/:claimId/reject', (req, res) => {
  const { reviewComment } = req.body
  const claim = claims[req.params.claimId]
  if (claim) {
    claim.status = 'rejected'
    claim.reviewComment = reviewComment
    return res.json({ code: 200, data: claim })
  }
  res.json({ code: 200, data: { id: req.params.claimId, status: 'rejected' } })
})

export { router as claimsRouter }
