import { Router, type Request, type Response } from 'express'
import type {
  VoiceprintSample,
  SampleStatus,
  ModelVersion,
  ModelStatus,
  ContentReviewItem,
  ContentType,
  ReviewStatus,
} from '../../shared/types.js'

const router = Router()

const sampleStatusLabels: Record<SampleStatus, string> = {
  pending: '待审',
  'auto-annotated': '已标',
  reviewed: '已审',
  rejected: '已拒绝',
}

const modelStatusLabels: Record<ModelStatus, string> = {
  training: '训练中',
  completed: '已完成',
  deployed: '已部署',
}

const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: '待审',
  approved: '已通过',
  rejected: '已拒绝',
  resampled: '已重采',
}

const contentTypeLabels: Record<ContentType, string> = {
  text: '文本',
  image: '图片',
  post: '帖子',
}

const mockSamples: VoiceprintSample[] = [
  {
    id: 's1',
    userId: 'user1',
    userName: '小白主人',
    audioUrl: '/audio/samples/s1.wav',
    petType: 'dog',
    status: 'pending',
    autoAnnotation: null,
    finalAnnotation: null,
    submittedAt: '2026-06-15T14:30:00Z',
  },
  {
    id: 's2',
    userId: 'user2',
    userName: '咪咪主人',
    audioUrl: '/audio/samples/s2.wav',
    petType: 'cat',
    status: 'auto-annotated',
    autoAnnotation: '喵喵叫 - 饥饿',
    finalAnnotation: null,
    submittedAt: '2026-06-15T12:15:00Z',
  },
  {
    id: 's3',
    userId: 'user3',
    userName: '豆豆主人',
    audioUrl: '/audio/samples/s3.wav',
    petType: 'dog',
    status: 'reviewed',
    autoAnnotation: '汪汪叫 - 警戒',
    finalAnnotation: '汪汪叫 - 警戒/欢迎混合',
    submittedAt: '2026-06-14T18:00:00Z',
  },
  {
    id: 's4',
    userId: 'user4',
    userName: '橘子主人',
    audioUrl: '/audio/samples/s4.wav',
    petType: 'cat',
    status: 'rejected',
    autoAnnotation: '呼噜声 - 满足',
    finalAnnotation: '噪音过大，无法识别',
    submittedAt: '2026-06-14T10:45:00Z',
  },
  {
    id: 's5',
    userId: 'user5',
    userName: '柴犬妈妈',
    audioUrl: '/audio/samples/s5.wav',
    petType: 'dog',
    status: 'pending',
    autoAnnotation: null,
    finalAnnotation: null,
    submittedAt: '2026-06-14T09:20:00Z',
  },
  {
    id: 's6',
    userId: 'user6',
    userName: '英短家长',
    audioUrl: '/audio/samples/s6.wav',
    petType: 'cat',
    status: 'auto-annotated',
    autoAnnotation: '哈气 - 愤怒',
    finalAnnotation: null,
    submittedAt: '2026-06-13T22:10:00Z',
  },
  {
    id: 's7',
    userId: 'user7',
    userName: '柯基爸爸',
    audioUrl: '/audio/samples/s7.wav',
    petType: 'dog',
    status: 'reviewed',
    autoAnnotation: '呜呜叫 - 悲伤',
    finalAnnotation: '呜呜叫 - 乞求/撒娇',
    submittedAt: '2026-06-13T16:30:00Z',
  },
  {
    id: 's8',
    userId: 'user8',
    userName: '布偶主人',
    audioUrl: '/audio/samples/s8.wav',
    petType: 'cat',
    status: 'pending',
    autoAnnotation: null,
    finalAnnotation: null,
    submittedAt: '2026-06-13T11:00:00Z',
  },
]

const mockModels: ModelVersion[] = [
  {
    id: 'm1',
    version: 'v2.3.1',
    accuracy: 0.924,
    trainingSamples: 15680,
    status: 'deployed',
    createdAt: '2026-06-10T08:00:00Z',
  },
  {
    id: 'm2',
    version: 'v2.3.0',
    accuracy: 0.908,
    trainingSamples: 14200,
    status: 'completed',
    createdAt: '2026-06-05T10:00:00Z',
  },
  {
    id: 'm3',
    version: 'v2.4.0-beta',
    accuracy: 0.0,
    trainingSamples: 18500,
    status: 'training',
    createdAt: '2026-06-15T06:00:00Z',
  },
  {
    id: 'm4',
    version: 'v2.2.5',
    accuracy: 0.891,
    trainingSamples: 12800,
    status: 'completed',
    createdAt: '2026-05-28T14:00:00Z',
  },
]

const mockReviews: ContentReviewItem[] = [
  {
    id: 'r1',
    contentType: 'post',
    content: '出售自家繁殖的纯种金毛幼犬，价格面议，微信联系xxxxxx...',
    status: 'pending',
    flaggedReason: ['广告推广', '违规交易'],
    submitterName: '匿名用户A',
    submittedAt: '2026-06-15T15:20:00Z',
  },
  {
    id: 'r2',
    contentType: 'text',
    content: '这只猫好丑啊，不如扔掉算了，看着就烦...',
    status: 'pending',
    flaggedReason: ['恶意言论', '人身攻击'],
    submitterName: '用户B',
    submittedAt: '2026-06-15T13:45:00Z',
  },
  {
    id: 'r3',
    contentType: 'image',
    content: '[图片] 含有敏感内容的照片',
    status: 'pending',
    flaggedReason: ['敏感图片'],
    submitterName: '用户C',
    submittedAt: '2026-06-15T11:30:00Z',
  },
  {
    id: 'r4',
    contentType: 'post',
    content: '听说最近有一种毒猫粮，大家千万别买XX牌子的...',
    status: 'pending',
    flaggedReason: ['未经证实的谣言'],
    submitterName: '用户D',
    submittedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'r5',
    contentType: 'text',
    content: '私聊我给你发资源哦~免费的！',
    status: 'pending',
    flaggedReason: ['诱导私聊', '可疑链接'],
    submitterName: '匿名用户E',
    submittedAt: '2026-06-15T08:20:00Z',
  },
  {
    id: 'r6',
    contentType: 'text',
    content: '一楼说的对，我也觉得那个兽医是骗子！',
    status: 'approved',
    flaggedReason: ['可能存在争议'],
    submitterName: '用户F',
    submittedAt: '2026-06-14T20:15:00Z',
  },
]

router.get('/voiceprint/samples', async (req: Request, res: Response): Promise<void> => {
  const { status, petType, limit = 50 } = req.query
  let samples = [...mockSamples]
  if (status) {
    samples = samples.filter(s => s.status === status)
  }
  if (petType) {
    samples = samples.filter(s => s.petType === petType)
  }
  samples = samples.slice(0, Number(limit))
  res.status(200).json({
    success: true,
    data: {
      samples,
      statusLabels: sampleStatusLabels,
    },
  })
})

router.put('/voiceprint/samples/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { status, finalAnnotation } = req.body
  const sample = mockSamples.find(s => s.id === id)
  if (!sample) {
    res.status(404).json({
      success: false,
      error: 'Sample not found',
    })
    return
  }
  if (status) sample.status = status
  if (finalAnnotation !== undefined) sample.finalAnnotation = finalAnnotation
  res.status(200).json({
    success: true,
    data: sample,
  })
})

router.get('/voiceprint/models', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      models: mockModels,
      statusLabels: modelStatusLabels,
    },
  })
})

router.post('/voiceprint/models/fine-tune', async (req: Request, res: Response): Promise<void> => {
  const { baseVersion, description } = req.body
  const newModel: ModelVersion = {
    id: `m${Date.now()}`,
    version: baseVersion ? `${baseVersion}-ft-${Date.now().toString().slice(-4)}` : `v2.4.${Math.floor(Math.random() * 10)}`,
    accuracy: 0,
    trainingSamples: mockSamples.filter(s => s.status === 'reviewed').length * 100 + 15000,
    status: 'training',
    createdAt: new Date().toISOString(),
  }
  mockModels.unshift(newModel)
  res.status(201).json({
    success: true,
    message: '微调任务已启动',
    data: newModel,
    description,
  })
})

router.get('/content/reviews', async (req: Request, res: Response): Promise<void> => {
  const { status, contentType, limit = 50 } = req.query
  let reviews = [...mockReviews]
  if (status) {
    reviews = reviews.filter(r => r.status === status)
  }
  if (contentType) {
    reviews = reviews.filter(r => r.contentType === contentType)
  }
  reviews = reviews.slice(0, Number(limit))
  res.status(200).json({
    success: true,
    data: {
      reviews,
      statusLabels: reviewStatusLabels,
      contentTypeLabels,
    },
  })
})

router.put('/content/reviews/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { status } = req.body
  const review = mockReviews.find(r => r.id === id)
  if (!review) {
    res.status(404).json({
      success: false,
      error: 'Review item not found',
    })
    return
  }
  review.status = status
  res.status(200).json({
    success: true,
    data: review,
  })
})

router.get('/content/stats', async (req: Request, res: Response): Promise<void> => {
  const total = mockReviews.length
  const pending = mockReviews.filter(r => r.status === 'pending').length
  const approved = mockReviews.filter(r => r.status === 'approved').length
  const rejected = mockReviews.filter(r => r.status === 'rejected').length

  const reasonCounts: Record<string, number> = {}
  mockReviews.forEach(r => {
    r.flaggedReason.forEach(reason => {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    })
  })

  const today = mockReviews.filter(r => {
    const d = new Date(r.submittedAt)
    return d.toDateString() === new Date('2026-06-15').toDateString()
  }).length

  res.status(200).json({
    success: true,
    data: {
      total,
      pending,
      approved,
      rejected,
      todayNew: today,
      topReasons: Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    },
  })
})

router.get('/analytics/overview', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      totalUsers: 12847,
      activeUsers: 4521,
      totalPets: 18932,
      totalAnalyses: 56789,
      modelAccuracy: 0.924,
      avgResponseTime: 0.23,
      growthRate: 12.5,
      samplesThisWeek: 342,
      approvedSamples: 298,
    },
  })
})

router.get('/analytics/weekly-report', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      weekStart: '2026-06-09',
      weekEnd: '2026-06-15',
      summary: [
        { label: '声纹分析次数', value: 8742, change: 15.3 },
        { label: '新增样本', value: 342, change: 8.6 },
        { label: '审核通过', value: 298, change: 12.1 },
        { label: '模型调用', value: 45621, change: 22.4 },
      ],
      topEmotions: [
        { name: '开心', count: 2456, percentage: 28.1 },
        { name: '饥饿', count: 1823, percentage: 20.9 },
        { name: '困倦', count: 1456, percentage: 16.7 },
        { name: '玩耍', count: 1234, percentage: 14.1 },
        { name: '好奇', count: 987, percentage: 11.3 },
        { name: '其他', count: 786, percentage: 8.9 },
      ],
    },
  })
})

router.get('/analytics/category-data', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: [
      { category: '基础服从', trained: 342, accuracy: 0.89 },
      { category: '技能训练', trained: 218, accuracy: 0.85 },
      { category: '行为纠正', trained: 156, accuracy: 0.78 },
      { category: '社交训练', trained: 98, accuracy: 0.82 },
      { category: '敏捷训练', trained: 67, accuracy: 0.91 },
      { category: '其他', trained: 45, accuracy: 0.76 },
    ],
  })
})

router.get('/analytics/trend-data', async (req: Request, res: Response): Promise<void> => {
  const days = ['06/09', '06/10', '06/11', '06/12', '06/13', '06/14', '06/15']
  res.status(200).json({
    success: true,
    data: {
      labels: days,
      datasets: [
        {
          name: '声纹分析',
          data: [980, 1120, 1340, 1080, 1450, 1580, 1692],
        },
        {
          name: '用户活跃',
          data: [620, 710, 850, 780, 920, 1050, 1150],
        },
        {
          name: '训练次数',
          data: [320, 380, 420, 410, 480, 520, 580],
        },
      ],
    },
  })
})

export default router
