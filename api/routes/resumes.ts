import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const mockResumes = [
  {
    id: 'r-001',
    userId: 'u-001',
    title: '前端工程师简历',
    lang: 'zh',
    templateId: 'template-1',
    sections: [
      { id: 's1', type: 'personal', order: 1, content: { name: '张三', phone: '13800138000', email: 'zhangsan@example.com' } },
      { id: 's2', type: 'education', order: 2, content: { school: '北京大学', degree: '本科', major: '计算机科学', period: '2015-2019' } },
      { id: 's3', type: 'experience', order: 3, content: { company: '字节跳动', role: '前端工程师', period: '2019-2022', description: '负责抖音Web端开发' } },
      { id: 's4', type: 'skills', order: 4, content: { items: ['React', 'TypeScript', 'Node.js', 'Webpack'] } }
    ],
    keywordDensity: { keywords: [{ word: 'React', count: 3, density: 2.1 }, { word: 'TypeScript', count: 2, density: 1.4 }], atsScore: 78 },
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-05-20T14:30:00Z'
  },
  {
    id: 'r-002',
    userId: 'u-001',
    title: 'Senior Frontend Engineer Resume',
    lang: 'en',
    templateId: 'template-2',
    sections: [
      { id: 's1', type: 'personal', order: 1, content: { name: 'Zhang San', phone: '+86 13800138000', email: 'zhangsan@example.com' } },
      { id: 's2', type: 'experience', order: 2, content: { company: 'ByteDance', role: 'Senior Frontend Engineer', period: '2019-2023', description: 'Led frontend team for TikTok Web' } },
      { id: 's3', type: 'skills', order: 3, content: { items: ['React', 'Vue', 'TypeScript', 'Node.js', 'GraphQL'] } }
    ],
    keywordDensity: { keywords: [{ word: 'Frontend', count: 2, density: 1.8 }, { word: 'React', count: 3, density: 2.5 }], atsScore: 82 },
    createdAt: '2025-02-10T08:00:00Z',
    updatedAt: '2025-06-01T09:00:00Z'
  },
  {
    id: 'r-003',
    userId: 'u-003',
    title: '后端开发简历',
    lang: 'zh',
    templateId: 'template-1',
    sections: [
      { id: 's1', type: 'personal', order: 1, content: { name: '王五', phone: '13900139000', email: 'wangwu@example.com' } },
      { id: 's2', type: 'education', order: 2, content: { school: '清华大学', degree: '硕士', major: '软件工程', period: '2017-2020' } },
      { id: 's3', type: 'experience', order: 3, content: { company: '阿里巴巴', role: 'Java后端工程师', period: '2020-2023', description: '负责电商核心系统开发' } }
    ],
    keywordDensity: { keywords: [{ word: 'Java', count: 4, density: 3.2 }, { word: 'Spring', count: 2, density: 1.6 }], atsScore: 75 },
    createdAt: '2025-03-05T12:00:00Z',
    updatedAt: '2025-05-18T16:00:00Z'
  }
]

router.get('/', (req: Request, res: Response): void => {
  res.json({ success: true, data: mockResumes })
})

router.get('/:id', (req: Request, res: Response): void => {
  const resume = mockResumes.find(r => r.id === req.params.id)
  if (!resume) {
    res.status(404).json({ success: false, error: '简历未找到' })
    return
  }
  res.json({ success: true, data: resume })
})

router.post('/', (req: Request, res: Response): void => {
  const { title, lang = 'zh', templateId = 'template-1', sections = [] } = req.body
  if (!title) {
    res.status(400).json({ success: false, error: '标题不能为空' })
    return
  }
  const newResume = {
    id: uuidv4(),
    userId: 'u-001',
    title,
    lang,
    templateId,
    sections,
    keywordDensity: { keywords: [], atsScore: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  res.status(201).json({ success: true, data: newResume })
})

router.put('/:id', (req: Request, res: Response): void => {
  const resume = mockResumes.find(r => r.id === req.params.id)
  if (!resume) {
    res.status(404).json({ success: false, error: '简历未找到' })
    return
  }
  const updated = { ...resume, ...req.body, id: resume.id, updatedAt: new Date().toISOString() }
  res.json({ success: true, data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const resume = mockResumes.find(r => r.id === req.params.id)
  if (!resume) {
    res.status(404).json({ success: false, error: '简历未找到' })
    return
  }
  res.json({ success: true, data: { id: req.params.id } })
})

export default router
