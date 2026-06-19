import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'

const router = Router()

const mockProcessors = [
  {
    id: 'P001',
    name: '深圳绿环再生资源有限公司',
    contactName: '陈经理',
    contactPhone: '138****1234',
    address: '深圳市宝安区环保产业园A栋',
    businessLicense: '91440300**********',
    categories: ['手机', '电脑', '平板'],
    status: 'approved',
    statusText: '已审核',
    rating: 4.8,
    totalProcessed: 15234,
    createdAt: dayjs().subtract(180, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'P002',
    name: '广州华星电子回收有限公司',
    contactName: '刘总',
    contactPhone: '139****5678',
    address: '广州市天河区科技园B区',
    businessLicense: '91440100**********',
    categories: ['手机', '平板'],
    status: 'pending',
    statusText: '待审核',
    rating: 0,
    totalProcessed: 0,
    createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'P003',
    name: '东莞鑫泰贵金属回收有限公司',
    contactName: '王主管',
    contactPhone: '137****9012',
    address: '东莞市长安镇环保路88号',
    businessLicense: '91441900**********',
    categories: ['电脑', '服务器', '配件'],
    status: 'approved',
    statusText: '已审核',
    rating: 4.6,
    totalProcessed: 8756,
    createdAt: dayjs().subtract(90, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'P004',
    name: '佛山恒信环保科技有限公司',
    contactName: '赵经理',
    contactPhone: '136****3456',
    address: '佛山市南海区环保工业区',
    businessLicense: '91440600**********',
    categories: ['手机', '电脑', '平板', '配件'],
    status: 'rejected',
    statusText: '已拒绝',
    rating: 0,
    totalProcessed: 0,
    rejectReason: '资质文件不完整',
    createdAt: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, category } = req.query

  let filtered = mockProcessors
  if (status) filtered = filtered.filter((p) => p.status === status)
  if (category) {
    filtered = filtered.filter((p) => p.categories.includes(category as string))
  }

  res.json({
    success: true,
    data: filtered,
  })
})

router.post('/:id/review', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { action, remark } = req.body

  const statusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'rejected',
  }
  const statusTextMap: Record<string, string> = {
    approved: '已审核',
    rejected: '已拒绝',
  }

  const newStatus = statusMap[action] || 'approved'

  res.json({
    success: true,
    data: {
      id,
      status: newStatus,
      statusText: statusTextMap[newStatus],
      reviewedBy: '管理员A',
      reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      remark: remark || '',
    },
  })
})

router.get('/:id/trace', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const processor = mockProcessors.find((p) => p.id === id) || mockProcessors[0]

  res.json({
    success: true,
    data: {
      processor: {
        id: processor.id,
        name: processor.name,
      },
      totalReceived: 2568,
      totalProcessed: 2456,
      totalValue: 12580000,
      monthlyTrend: [
        { month: '2024-01', received: 420, processed: 408, value: 2050000 },
        { month: '2024-02', received: 380, processed: 372, value: 1890000 },
        { month: '2024-03', received: 450, processed: 432, value: 2180000 },
        { month: '2024-04', received: 480, processed: 468, value: 2320000 },
        { month: '2024-05', received: 520, processed: 498, value: 2560000 },
        { month: '2024-06', received: 318, processed: 278, value: 1580000 },
      ],
      recentBatches: [
        {
          batchNo: 'BATCH20240601001',
          receivedAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          quantity: 156,
          categories: [{ name: '手机', count: 120 }, { name: '电脑', count: 36 }],
          status: 'processing',
        },
        {
          batchNo: 'BATCH20240525002',
          receivedAt: dayjs().subtract(8, 'day').format('YYYY-MM-DD HH:mm:ss'),
          quantity: 234,
          categories: [{ name: '手机', count: 180 }, { name: '平板', count: 54 }],
          status: 'completed',
        },
      ],
    },
  })
})

export default router
