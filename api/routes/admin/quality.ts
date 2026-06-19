import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'

const router = Router()

const mockQualityOrders = [
  {
    id: 'QO20240101001',
    orderId: 'ORD20240101002',
    orderNo: 'ORD20240101002',
    status: 'ai_screened',
    statusText: 'AI初筛完成',
    category: '电脑',
    brand: '联想',
    model: 'ThinkPad X1 Carbon',
    condition: '9成新',
    weight: 1130,
    estimatedPrice: 6800,
    createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    aiScreenResult: {
      screenPassed: true,
      damageDetected: ['轻微划痕'],
      authenticity: '疑似正品',
      riskLevel: 'low',
      suggestions: ['建议人工确认外观'],
      screenedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
  },
  {
    id: 'QO20240101002',
    orderId: 'ORD20240101004',
    orderNo: 'ORD20240101004',
    status: 'pending',
    statusText: '待质检',
    category: '手机',
    brand: '小米',
    model: '小米13 Ultra',
    condition: '95新',
    weight: 227,
    estimatedPrice: 3800,
    createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'QO20240101003',
    orderId: 'ORD20240101005',
    orderNo: 'ORD20240101005',
    status: 'manual_completed',
    statusText: '人工质检完成',
    category: '手机',
    brand: '三星',
    model: 'Galaxy S23 Ultra',
    condition: '99新',
    weight: 233,
    estimatedPrice: 5500,
    createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
    manualResult: {
      inspector: '质检员工A',
      appearanceScore: 95,
      functionScore: 100,
      finalCondition: '99新',
      finalPrice: 5600,
      remarks: '成色极佳，功能完好',
      inspectedAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
    },
  },
]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, page = 1, pageSize = 10 } = req.query
  const pageNum = Number(page)
  const size = Number(pageSize)

  let filtered = mockQualityOrders
  if (status) {
    filtered = mockQualityOrders.filter((o) => o.status === status)
  }

  const start = (pageNum - 1) * size
  const list = filtered.slice(start, start + size)

  res.json({
    success: true,
    data: {
      list,
      total: filtered.length,
      page: pageNum,
      pageSize: size,
    },
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const order = mockQualityOrders.find((o) => o.id === id) || mockQualityOrders[0]

  res.json({
    success: true,
    data: {
      ...order,
      images: [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
        'https://example.com/img3.jpg',
      ],
      checkItems: [
        { name: '外观检查', result: '通过', remark: '轻微划痕' },
        { name: '屏幕检查', result: '通过', remark: '无亮点' },
        { name: '电池检查', result: '通过', remark: '健康度92%' },
        { name: '功能检查', result: '通过', remark: '功能完好' },
      ],
    },
  })
})

router.post('/:id/ai-screen', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  res.json({
    success: true,
    data: {
      id,
      status: 'ai_screened',
      statusText: 'AI初筛完成',
      aiScreenResult: {
        screenPassed: true,
        damageDetected: ['轻微划痕', '边框轻微磕碰'],
        authenticity: '正品',
        riskLevel: 'low',
        suggestions: ['建议人工确认屏幕是否有暗伤'],
        screenedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    },
  })
})

router.put('/:id/manual', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { appearanceScore, functionScore, finalCondition, finalPrice, remarks } = req.body

  res.json({
    success: true,
    data: {
      id,
      status: 'manual_completed',
      statusText: '人工质检完成',
      manualResult: {
        inspector: '质检员工A',
        appearanceScore: appearanceScore || 90,
        functionScore: functionScore || 95,
        finalCondition: finalCondition || '95新',
        finalPrice: finalPrice || 5000,
        remarks: remarks || '',
        inspectedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    },
  })
})

export default router
