import { Router, type Request, type Response } from 'express'
import { SecurityService } from '../services/SecurityService.js'

const router = Router()
const securityService = new SecurityService()

router.get('/desensitize', (req: Request, res: Response) => {
  const compliance = securityService.getComplianceStatus()
  res.json({ success: true, data: compliance.desensitization_rules })
})

router.put('/desensitize/:id', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Rule updated' })
})

router.post('/decrypt-apply', (req: Request, res: Response) => {
  const request = securityService.createDecryptRequest(req.body)
  res.status(201).json({ success: true, data: request })
})

router.get('/decrypt-requests', (req: Request, res: Response) => {
  const { page = 1, pageSize = 10, status } = req.query
  const result = securityService.getDecryptRequests({
    page: Number(page),
    pageSize: Number(pageSize),
    status: status as string,
  })
  res.json({ success: true, data: result.data, total: result.total })
})

router.put('/decrypt-requests/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { action, admin_id, reason } = req.body

  if (action === 'approve') {
    const result = securityService.approveDecryptRequest(id, admin_id)
    res.json({ success: true, data: result })
  } else if (action === 'reject') {
    const result = securityService.rejectDecryptRequest(id, admin_id, reason)
    res.json({ success: true, data: result })
  } else {
    res.status(400).json({ success: false, error: 'Invalid action' })
  }
})

router.get('/decrypt-data/:requestId', (req: Request, res: Response) => {
  try {
    const requestId = Number(req.params.requestId)
    const data = securityService.getDecryptedData(requestId)
    res.setHeader('x-skip-desensitize', 'true')
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/compliance', (req: Request, res: Response) => {
  const data = securityService.getComplianceStatus()
  res.json({ success: true, data })
})

router.get('/audit-log', (req: Request, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query
  const result = securityService.getAuditLogs({
    page: Number(page),
    pageSize: Number(pageSize),
  })
  res.json({ success: true, data: result.data, total: result.total })
})

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body
  const admin = securityService.adminLogin(username, password)
  if (admin) {
    res.json({ success: true, data: admin })
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' })
  }
})

export default router
