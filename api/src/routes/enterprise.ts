import { Router } from 'express'

const router = Router()

const apiCredentials: Record<string, any> = {}

router.post('/apply', (req, res) => {
  const { companyName, creditCode, contactName, contactPhone, email, scenarios = [], dailyCallVolume = 1000, valueAddedServices = [] } = req.body

  if (!companyName || !creditCode || !contactName || !contactPhone) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }

  const appNo = 'API' + Date.now()
  const clientId = 'ck_' + Buffer.from(companyName).toString('base64').slice(0, 16)
  const clientSecret = 'sk_' + Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 18)

  apiCredentials[appNo] = {
    appNo,
    companyName,
    creditCode,
    clientId,
    clientSecret,
    scenarios,
    dailyCallVolume,
    valueAddedServices,
    status: 'pending_review',
    createdAt: new Date().toISOString()
  }

  res.status(201).json({
    code: 201,
    message: 'success',
    data: {
      appNo,
      status: 'pending_review',
      estimatedReviewDays: '1-3个工作日',
      nextStep: '审核通过后将通过邮件发送API密钥',
      clientId,
      clientSecret
    }
  })
})

router.post('/token', (req, res) => {
  const { clientId, clientSecret } = req.body

  if (!clientId || !clientSecret) {
    return res.status(400).json({ code: 400, message: '缺少 clientId 或 clientSecret' })
  }

  res.json({
    code: 200,
    data: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiJkZW1vIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwODY0MDB9.demo_signature',
      token_type: 'Bearer',
      expires_in: 86400
    }
  })
})

router.get('/endpoints', (_req, res) => {
  res.json({
    code: 200,
    data: [
      { method: 'POST', path: '/api/v1/orders', name: '创建运单', category: '订单管理' },
      { method: 'GET', path: '/api/v1/orders/{waybillNo}', name: '查询运单详情', category: '订单管理' },
      { method: 'GET', path: '/api/v1/tracking/{waybillNo}/monitor', name: '获取运输监控数据', category: '运输监控' },
      { method: 'POST', path: '/api/v1/tracking/{waybillNo}/alerts/{alertId}/acknowledge', name: '确认告警', category: '运输监控' },
      { method: 'GET', path: '/api/v1/packaging/options', name: '获取包装选项', category: '包装报价' },
      { method: 'POST', path: '/api/v1/packaging/quote', name: '计算包装报价', category: '包装报价' },
      { method: 'POST', path: '/api/v1/claims', name: '提交理赔申请', category: '理赔服务' },
      { method: 'GET', path: '/api/v1/claims/{claimId}', name: '查询理赔详情', category: '理赔服务' },
      { method: 'GET', path: '/api/v1/vehicles', name: '获取车辆列表', category: '车辆管理' },
      { method: 'GET', path: '/api/v1/vehicles/platform-status', name: '监控平台对接状态', category: '车辆管理' }
    ]
  })
})

export { router as enterpriseRouter }
