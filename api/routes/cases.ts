import { Router, type Request, type Response } from 'express'

const router = Router()

const mockCases = [
  {
    id: 'c-001',
    industry: '互联网',
    level: 'senior',
    company: '字节跳动',
    summary: '从0到1搭建抖音国际化前端架构，主导微前端方案落地',
    highlights: ['主导微前端架构设计，支撑10+子应用', '搭建前端监控体系，页面性能提升40%', '推动TypeScript落地，代码缺陷率降低35%'],
    sections: [
      { type: 'experience', title: '字节跳动 - 高级前端工程师', content: '负责抖音Web端架构设计和核心模块开发' },
      { type: 'education', title: '浙江大学 - 计算机科学硕士', content: '2014-2017' }
    ],
    tags: ['微前端', 'React', 'TypeScript', '性能优化']
  },
  {
    id: 'c-002',
    industry: '金融',
    level: 'mid',
    company: '蚂蚁集团',
    summary: '负责支付宝小程序开发者工具链建设',
    highlights: ['设计并实现小程序编译优化管线', '开发者工具日活提升60%', '获得年度技术突破奖'],
    sections: [
      { type: 'experience', title: '蚂蚁集团 - 前端技术专家', content: '小程序开发者工具链核心开发' },
      { type: 'education', title: '上海交通大学 - 软件工程本科', content: '2015-2019' }
    ],
    tags: ['小程序', '编译器', '工具链', 'Node.js']
  },
  {
    id: 'c-003',
    industry: '互联网',
    level: 'junior',
    company: '美团',
    summary: '参与美团外卖商家端前端开发，独立负责订单管理模块',
    highlights: ['独立完成订单管理模块全流程开发', '优化页面加载速度，FCP降低50%', '推动团队代码规范落地'],
    sections: [
      { type: 'experience', title: '美团 - 前端开发工程师', content: '外卖商家端核心模块开发' },
      { type: 'education', title: '华中科技大学 - 计算机科学本科', content: '2018-2022' }
    ],
    tags: ['Vue', '小程序', '性能优化']
  },
  {
    id: 'c-004',
    industry: 'AI',
    level: 'senior',
    company: 'OpenAI',
    summary: 'LLM应用层架构师，主导ChatGPT前端交互设计',
    highlights: ['设计流式响应渲染架构', '实现多模态输入交互系统', '支撑千万级日活用户'],
    sections: [
      { type: 'experience', title: 'OpenAI - 前端架构师', content: 'ChatGPT前端架构设计' },
      { type: 'education', title: 'MIT - Computer Science PhD', content: '2015-2020' }
    ],
    tags: ['LLM', '流式渲染', 'React', 'WebSockets']
  }
]

router.get('/', (req: Request, res: Response): void => {
  const { industry, level, company } = req.query
  let filtered = [...mockCases]

  if (industry) {
    filtered = filtered.filter(c => c.industry === industry)
  }
  if (level) {
    filtered = filtered.filter(c => c.level === level)
  }
  if (company) {
    filtered = filtered.filter(c => c.company.includes(String(company)))
  }

  res.json({ success: true, data: filtered })
})

router.get('/filters', (req: Request, res: Response): void => {
  const industries = [...new Set(mockCases.map(c => c.industry))]
  const levels = [...new Set(mockCases.map(c => c.level))]
  const companies = [...new Set(mockCases.map(c => c.company))]

  res.json({
    success: true,
    data: { industries, levels, companies }
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const caseItem = mockCases.find(c => c.id === req.params.id)
  if (!caseItem) {
    res.status(404).json({ success: false, error: '案例未找到' })
    return
  }
  res.json({ success: true, data: caseItem })
})

export default router
