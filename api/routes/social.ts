import { Router, type Request, type Response } from 'express'

const router = Router()

interface Post {
  id: string
  author: string
  avatar: string
  content: string
  images: string[]
  likes: number
  comments: number
  createdAt: string
}

const posts: Post[] = [
  { id: 'post-001', author: '林小明', avatar: '', content: '今天食堂的黄焖鸡太好吃了！强烈推荐！', images: [], likes: 24, comments: 5, createdAt: '2026-06-09T08:30:00Z' },
  { id: 'post-002', author: '张同学', avatar: '', content: '有没有人一起组队参加下周的编程竞赛？求队友！', images: [], likes: 12, comments: 8, createdAt: '2026-06-09T09:15:00Z' },
  { id: 'post-003', author: '王学姐', avatar: '', content: '毕业论文终于答辩完了，感谢导师的悉心指导！🎓', images: [], likes: 56, comments: 15, createdAt: '2026-06-09T10:00:00Z' },
  { id: 'post-004', author: '赵同学', avatar: '', content: '图书馆占座太严重了，能不能管管？', images: [], likes: 89, comments: 32, createdAt: '2026-06-09T10:30:00Z' },
  { id: 'post-005', author: '李老师', avatar: '', content: '本周六下午2点，学术报告厅有AI前沿讲座，欢迎参加！', images: [], likes: 34, comments: 6, createdAt: '2026-06-09T11:00:00Z' },
  { id: 'post-006', author: '陈同学', avatar: '', content: '校园超市新进了一批进口零食，价格还挺实惠', images: [], likes: 18, comments: 4, createdAt: '2026-06-09T11:30:00Z' },
  { id: 'post-007', author: '刘同学', avatar: '', content: '健身房今天人好多，还是明天早上来吧', images: [], likes: 7, comments: 2, createdAt: '2026-06-09T12:00:00Z' },
  { id: 'post-008', author: '周同学', avatar: '', content: '求推荐好用的考研网课平台！', images: [], likes: 15, comments: 11, createdAt: '2026-06-09T12:30:00Z' },
]

let postCounter = 8

interface Textbook {
  id: string
  title: string
  author: string
  course: string
  condition: '全新' | '九成新' | '八成新' | '七成新'
  originalPrice: number
  sellPrice: number
  seller: string
  sellerId: string
  status: 'available' | 'sold' | 'escrow'
  createdAt: string
}

const textbooks: Textbook[] = [
  { id: 'tb-001', title: '高等数学（第七版）上册', author: '同济大学数学系', course: '高等数学I', condition: '九成新', originalPrice: 46, sellPrice: 20, seller: '林小明', sellerId: 'u001', status: 'available', createdAt: '2026-06-08T10:00:00Z' },
  { id: 'tb-002', title: '大学英语综合教程2', author: '何兆熊', course: '大学英语II', condition: '八成新', originalPrice: 52, sellPrice: 18, seller: '张同学', sellerId: 'u002', status: 'available', createdAt: '2026-06-08T11:00:00Z' },
  { id: 'tb-003', title: '数据结构与算法分析', author: '陈越', course: '数据结构', condition: '全新', originalPrice: 65, sellPrice: 40, seller: '王学姐', sellerId: 'u003', status: 'available', createdAt: '2026-06-08T14:00:00Z' },
  { id: 'tb-004', title: '线性代数（第六版）', author: '同济大学数学系', course: '线性代数', condition: '七成新', originalPrice: 35, sellPrice: 10, seller: '赵同学', sellerId: 'u004', status: 'available', createdAt: '2026-06-09T08:00:00Z' },
  { id: 'tb-005', title: '概率论与数理统计', author: '浙大编', course: '概率论', condition: '九成新', originalPrice: 42, sellPrice: 22, seller: '李同学', sellerId: 'u005', status: 'available', createdAt: '2026-06-09T09:00:00Z' },
  { id: 'tb-006', title: '计算机网络（第七版）', author: '谢希仁', course: '计算机网络', condition: '八成新', originalPrice: 59, sellPrice: 28, seller: '陈同学', sellerId: 'u006', status: 'available', createdAt: '2026-06-09T10:00:00Z' },
]

let textbookCounter = 6

interface Internship {
  id: string
  title: string
  company: string
  location: string
  salary: string
  requirements: string[]
  tags: string[]
  deadline: string
  matchScore?: number
}

const internships: Internship[] = [
  { id: 'int-001', title: '前端开发实习生', company: '字节跳动', location: '北京', salary: '300-400元/天', requirements: ['熟悉React/Vue', '了解TypeScript', '本科在读'], tags: ['大厂', '前端', '日结'], deadline: '2026-07-15', matchScore: 95 },
  { id: 'int-002', title: '后端开发实习生', company: '腾讯', location: '深圳', salary: '350-450元/天', requirements: ['熟悉Java/Go', '了解微服务', '本科在读'], tags: ['大厂', '后端', '可转正'], deadline: '2026-07-20', matchScore: 88 },
  { id: 'int-003', title: '算法实习生', company: '百度', location: '北京', salary: '400-500元/天', requirements: ['熟悉Python', '了解深度学习', '硕士优先'], tags: ['大厂', 'AI', '高薪'], deadline: '2026-07-10', matchScore: 72 },
  { id: 'int-004', title: '产品经理实习生', company: '美团', location: '上海', salary: '200-300元/天', requirements: ['良好的沟通能力', '数据分析能力', '本科在读'], tags: ['互联网', '产品', '实习证明'], deadline: '2026-07-25', matchScore: 65 },
  { id: 'int-005', title: '数据分析实习生', company: '京东', location: '北京', salary: '250-350元/天', requirements: ['熟悉SQL', '了解Python', '统计学专业优先'], tags: ['电商', '数据', '日结'], deadline: '2026-07-18', matchScore: 58 },
  { id: 'int-006', title: 'UI设计实习生', company: '网易', location: '杭州', salary: '200-280元/天', requirements: ['熟练Figma/Sketch', '有作品集', '设计专业'], tags: ['大厂', '设计', '可转正'], deadline: '2026-07-22', matchScore: 42 },
]

router.get('/posts', (req: Request, res: Response) => {
  const skip = parseInt(req.query.skip as string) || 0
  const limit = parseInt(req.query.limit as string) || 10
  const sorted = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const sliced = sorted.slice(skip, skip + limit)
  res.json({ success: true, data: sliced, total: posts.length, skip, limit })
})

router.post('/posts', (req: Request, res: Response) => {
  const { author, content, images } = req.body
  if (!content) {
    res.status(400).json({ success: false, error: '内容不能为空' })
    return
  }
  postCounter++
  const post: Post = {
    id: `post-${String(postCounter).padStart(3, '0')}`,
    author: author || '匿名用户',
    avatar: '',
    content,
    images: images || [],
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
  }
  posts.unshift(post)
  res.status(201).json({ success: true, data: post })
})

router.get('/textbooks', (_req: Request, res: Response) => {
  const available = textbooks.filter((t) => t.status !== 'sold')
  res.json({ success: true, data: available })
})

router.post('/textbooks', (req: Request, res: Response) => {
  const { title, author, course, condition, originalPrice, sellPrice, seller, sellerId } = req.body
  if (!title || !sellPrice) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }
  textbookCounter++
  const textbook: Textbook = {
    id: `tb-${String(textbookCounter).padStart(3, '0')}`,
    title,
    author: author || '',
    course: course || '',
    condition: condition || '八成新',
    originalPrice: originalPrice || sellPrice,
    sellPrice,
    seller: seller || '匿名卖家',
    sellerId: sellerId || '',
    status: 'available',
    createdAt: new Date().toISOString(),
  }
  textbooks.push(textbook)
  res.status(201).json({ success: true, data: textbook })
})

router.post('/textbooks/:id/buy', (req: Request, res: Response) => {
  const textbook = textbooks.find((t) => t.id === req.params.id)
  if (!textbook) {
    res.status(404).json({ success: false, error: '教材不存在' })
    return
  }
  if (textbook.status !== 'available') {
    res.status(400).json({ success: false, error: '教材已售出或交易中' })
    return
  }
  textbook.status = 'escrow'
  res.json({ success: true, data: { textbook, escrowAmount: textbook.sellPrice, escrowStatus: '托管中', message: '已进入托管支付，确认收货后自动打款' } })
})

router.get('/internships', (_req: Request, res: Response) => {
  res.json({ success: true, data: internships })
})

router.get('/internships/match', (_req: Request, res: Response) => {
  const matched = internships
    .filter((i) => i.matchScore !== undefined && i.matchScore >= 50)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
  res.json({ success: true, data: matched })
})

export default router
