import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const mockApplications = [
  {
    id: 'a-001',
    userId: 'u-001',
    company: '腾讯',
    position: '高级前端工程师',
    status: 'interview',
    resumeId: 'r-001',
    appliedAt: '2025-05-20',
    interviews: [
      { id: 'iv-001', date: '2025-05-28', type: 'phone', notes: '技术电话面试' },
      { id: 'iv-002', date: '2025-06-03', type: 'technical', notes: '现场技术面试' }
    ],
    offer: null,
    notes: '腾讯WXG事业群'
  },
  {
    id: 'a-002',
    userId: 'u-001',
    company: '阿里',
    position: '前端技术专家',
    status: 'offer',
    resumeId: 'r-001',
    appliedAt: '2025-04-15',
    interviews: [
      { id: 'iv-003', date: '2025-04-22', type: 'phone', notes: 'HR初面' },
      { id: 'iv-004', date: '2025-04-28', type: 'technical', notes: '技术交叉面' },
      { id: 'iv-005', date: '2025-05-05', type: 'onsite', notes: 'onsite终面' }
    ],
    offer: { baseSalary: 550000, bonus: '3个月', benefits: ['餐补', '健身房', '弹性工作'], equity: 'RSU 2000股/4年', deadline: '2025-06-15' },
    notes: '阿里云P7'
  },
  {
    id: 'a-003',
    userId: 'u-001',
    company: 'Google',
    position: 'Senior Frontend Engineer',
    status: 'applied',
    resumeId: 'r-002',
    appliedAt: '2025-06-01',
    interviews: [],
    offer: null,
    notes: 'L5 level, Mountain View'
  },
  {
    id: 'a-004',
    userId: 'u-003',
    company: '华为',
    position: '后端开发工程师',
    status: 'todo',
    resumeId: 'r-003',
    appliedAt: null,
    interviews: [],
    offer: null,
    notes: '消费者BG'
  }
]

router.get('/', (req: Request, res: Response): void => {
  const { status } = req.query
  let filtered = [...mockApplications]
  if (status) {
    filtered = filtered.filter(a => a.status === status)
  }
  res.json({ success: true, data: filtered })
})

router.post('/', (req: Request, res: Response): void => {
  const { company, position, resumeId, notes } = req.body
  if (!company || !position) {
    res.status(400).json({ success: false, error: '公司名称和职位不能为空' })
    return
  }
  const newApp = {
    id: uuidv4(),
    userId: 'u-001',
    company,
    position,
    status: 'todo',
    resumeId: resumeId || null,
    appliedAt: null,
    interviews: [],
    offer: null,
    notes: notes || ''
  }
  res.status(201).json({ success: true, data: newApp })
})

router.put('/:id', (req: Request, res: Response): void => {
  const app = mockApplications.find(a => a.id === req.params.id)
  if (!app) {
    res.status(404).json({ success: false, error: '投递记录未找到' })
    return
  }
  const updated = { ...app, ...req.body, id: app.id }
  res.json({ success: true, data: updated })
})

router.put('/:id/status', (req: Request, res: Response): void => {
  const { status } = req.body
  const validStatuses = ['todo', 'applied', 'interview', 'offer', 'rejected']
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `状态值无效，有效值: ${validStatuses.join(', ')}` })
    return
  }
  const app = mockApplications.find(a => a.id === req.params.id)
  if (!app) {
    res.status(404).json({ success: false, error: '投递记录未找到' })
    return
  }
  const updated = {
    ...app,
    status,
    appliedAt: status === 'applied' && !app.appliedAt ? new Date().toISOString().split('T')[0] : app.appliedAt
  }
  res.json({ success: true, data: updated })
})

router.post('/compare', (req: Request, res: Response): void => {
  const { applicationIds } = req.body
  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length < 2) {
    res.status(400).json({ success: false, error: '请提供至少两个投递记录ID进行对比' })
    return
  }

  const selectedApps = mockApplications.filter(a => applicationIds.includes(a.id))
  if (selectedApps.length < 2) {
    res.status(404).json({ success: false, error: '未找到足够的投递记录' })
    return
  }

  const comparison = selectedApps.map(app => ({
    id: app.id,
    company: app.company,
    position: app.position,
    status: app.status,
    hasOffer: !!app.offer,
    salary: app.offer?.baseSalary || 0,
    bonus: app.offer?.bonus || '-',
    benefits: app.offer?.benefits || [],
    equity: app.offer?.equity || '-',
    deadline: app.offer?.deadline || '-'
  }))

  res.json({ success: true, data: { applications: comparison, comparedAt: new Date().toISOString() } })
})

export default router
