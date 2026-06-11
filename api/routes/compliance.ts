import { Router, type Request, type Response } from 'express'

const router = Router()

const mockSettings = {
  dataMinimization: true,
  encryptedStorage: true,
  retentionDays: 365
}

const mockAuditLogs = [
  { id: 'al-001', userId: 'u-001', action: 'create', resource: 'resume', timestamp: '2025-01-15T10:00:00Z', details: { resumeId: 'r-001', title: '前端工程师简历' } },
  { id: 'al-002', userId: 'u-001', action: 'create', resource: 'resume', timestamp: '2025-02-10T08:00:00Z', details: { resumeId: 'r-002', title: 'Senior Frontend Engineer Resume' } },
  { id: 'al-003', userId: 'u-001', action: 'update', resource: 'resume', timestamp: '2025-05-20T14:30:00Z', details: { resumeId: 'r-001', field: 'sections' } },
  { id: 'al-004', userId: 'u-001', action: 'create', resource: 'application', timestamp: '2025-05-20T09:00:00Z', details: { company: '腾讯', position: '高级前端工程师' } },
  { id: 'al-005', userId: 'u-001', action: 'update', resource: 'application', timestamp: '2025-05-10T11:00:00Z', details: { company: '阿里', status: 'offer' } },
  { id: 'al-006', userId: 'u-003', action: 'create', resource: 'resume', timestamp: '2025-03-05T12:00:00Z', details: { resumeId: 'r-003', title: '后端开发简历' } },
  { id: 'al-007', userId: 'u-001', action: 'delete', resource: 'resume', timestamp: '2025-04-01T15:00:00Z', details: { resumeId: 'r-old', title: '旧版简历' } },
  { id: 'al-008', userId: 'u-002', action: 'create', resource: 'template', timestamp: '2025-01-10T10:00:00Z', details: { templateId: 't-001', name: '技术岗通用模板' } }
]

router.get('/settings', (req: Request, res: Response): void => {
  res.json({ success: true, data: mockSettings })
})

router.put('/settings', (req: Request, res: Response): void => {
  const { dataMinimization, encryptedStorage, retentionDays } = req.body
  const updated = { ...mockSettings }
  if (typeof dataMinimization === 'boolean') updated.dataMinimization = dataMinimization
  if (typeof encryptedStorage === 'boolean') updated.encryptedStorage = encryptedStorage
  if (typeof retentionDays === 'number' && retentionDays > 0) updated.retentionDays = retentionDays
  res.json({ success: true, data: updated })
})

router.post('/delete-account', (req: Request, res: Response): void => {
  const { confirmation } = req.body
  if (confirmation !== 'DELETE_MY_ACCOUNT') {
    res.status(400).json({ success: false, error: '请输入确认码 DELETE_MY_ACCOUNT 以确认删除' })
    return
  }
  res.json({
    success: true,
    data: {
      deletedAt: new Date().toISOString(),
      deletedData: {
        resumes: 3,
        applications: 4,
        auditLogs: 5,
        complianceSettings: 1
      },
      message: '账户及所有关联数据已删除'
    }
  })
})

router.get('/audit-logs', (req: Request, res: Response): void => {
  const { action, resource, limit = '20', offset = '0' } = req.query
  let filtered = [...mockAuditLogs]

  if (action) {
    filtered = filtered.filter(log => log.action === action)
  }
  if (resource) {
    filtered = filtered.filter(log => log.resource === resource)
  }

  const start = parseInt(String(offset), 10)
  const count = parseInt(String(limit), 10)
  const paginated = filtered.slice(start, start + count)

  res.json({
    success: true,
    data: {
      logs: paginated,
      total: filtered.length,
      limit: count,
      offset: start
    }
  })
})

export default router
