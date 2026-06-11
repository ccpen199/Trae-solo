import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const mockTemplates = [
  {
    id: 't-001',
    companyId: 'u-002',
    name: '技术岗通用模板',
    sections: [
      { type: 'personal', required: true, order: 1 },
      { type: 'education', required: true, order: 2 },
      { type: 'experience', required: true, order: 3 },
      { type: 'skills', required: true, order: 4 },
      { type: 'projects', required: false, order: 5 }
    ],
    scoringCriteria: {
      dimensions: [
        { name: '技术深度', weight: 0.3 },
        { name: '项目经验', weight: 0.25 },
        { name: '教育背景', weight: 0.15 },
        { name: '软技能', weight: 0.15 },
        { name: '文化匹配', weight: 0.15 }
      ],
      thresholds: { autoReject: 40, autoAdvance: 80 }
    },
    createdAt: '2025-01-10T10:00:00Z'
  },
  {
    id: 't-002',
    companyId: 'u-002',
    name: '产品岗评估模板',
    sections: [
      { type: 'personal', required: true, order: 1 },
      { type: 'experience', required: true, order: 2 },
      { type: 'projects', required: true, order: 3 },
      { type: 'skills', required: false, order: 4 }
    ],
    scoringCriteria: {
      dimensions: [
        { name: '产品思维', weight: 0.35 },
        { name: '数据驱动', weight: 0.25 },
        { name: '沟通能力', weight: 0.2 },
        { name: '技术理解', weight: 0.2 }
      ],
      thresholds: { autoReject: 45, autoAdvance: 75 }
    },
    createdAt: '2025-02-15T14:00:00Z'
  }
]

router.get('/templates', (req: Request, res: Response): void => {
  res.json({ success: true, data: mockTemplates })
})

router.post('/templates', (req: Request, res: Response): void => {
  const { name, sections, scoringCriteria } = req.body
  if (!name) {
    res.status(400).json({ success: false, error: '模板名称不能为空' })
    return
  }
  const newTemplate = {
    id: uuidv4(),
    companyId: 'u-002',
    name,
    sections: sections || [],
    scoringCriteria: scoringCriteria || { dimensions: [], thresholds: { autoReject: 40, autoAdvance: 80 } },
    createdAt: new Date().toISOString()
  }
  res.status(201).json({ success: true, data: newTemplate })
})

router.put('/templates/:id', (req: Request, res: Response): void => {
  const template = mockTemplates.find(t => t.id === req.params.id)
  if (!template) {
    res.status(404).json({ success: false, error: '模板未找到' })
    return
  }
  const updated = { ...template, ...req.body, id: template.id }
  res.json({ success: true, data: updated })
})

router.post('/screening', (req: Request, res: Response): void => {
  const { templateId, criteria, autoAdvance, autoReject } = req.body

  res.json({
    success: true,
    data: {
      screeningId: uuidv4(),
      templateId: templateId || null,
      criteria: criteria || {},
      autoAdvance: autoAdvance ?? true,
      autoReject: autoReject ?? true,
      status: 'active',
      createdAt: new Date().toISOString()
    }
  })
})

router.get('/analytics', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      totalApplications: 156,
      byStatus: {
        todo: 23,
        applied: 45,
        interview: 38,
        offer: 12,
        rejected: 38
      },
      bySource: {
        direct: 67,
        referral: 45,
        campus: 44
      },
      averageTimeToOffer: 28,
      topPositions: [
        { position: '前端工程师', count: 32 },
        { position: 'Java开发', count: 28 },
        { position: '产品经理', count: 21 },
        { position: '数据分析师', count: 18 },
        { position: 'UI设计师', count: 15 }
      ],
      monthlyTrend: [
        { month: '2025-01', applications: 22, offers: 2 },
        { month: '2025-02', applications: 28, offers: 3 },
        { month: '2025-03', applications: 35, offers: 4 },
        { month: '2025-04', applications: 31, offers: 2 },
        { month: '2025-05', applications: 24, offers: 1 },
        { month: '2025-06', applications: 16, offers: 0 }
      ]
    }
  })
})

export default router
