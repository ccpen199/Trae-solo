import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'

const router = Router()

const mockPayouts = [
  {
    id: 'PAY20240101001',
    payoutNo: 'PAY20240101001',
    orderId: 'ORD20240101003',
    orderNo: 'ORD20240101003',
    userId: 'U001',
    userName: '王五',
    userPhone: '137****9999',
    amount: 5900,
    status: 'pending',
    statusText: '待打款',
    payMethod: 'alipay',
    payAccount: 'wang***@alipay.com',
    qualityPrice: 5900,
    serviceFee: 0,
    actualAmount: 5900,
    createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'PAY20240101002',
    payoutNo: 'PAY20240101002',
    orderId: 'ORD20240101006',
    orderNo: 'ORD20240101006',
    userId: 'U002',
    userName: '赵六',
    userPhone: '136****7777',
    amount: 3200,
    status: 'pending',
    statusText: '待打款',
    payMethod: 'wechat',
    payAccount: '136****7777',
    qualityPrice: 3300,
    serviceFee: 100,
    actualAmount: 3200,
    createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'PAY20240101003',
    payoutNo: 'PAY20240101003',
    orderId: 'ORD20240101007',
    orderNo: 'ORD20240101007',
    userId: 'U003',
    userName: '钱七',
    userPhone: '135****5555',
    amount: 8500,
    status: 'completed',
    statusText: '已打款',
    payMethod: 'bank',
    payAccount: '招商银行 ****8888',
    qualityPrice: 8600,
    serviceFee: 100,
    actualAmount: 8500,
    createdAt: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
    paidAt: dayjs().subtract(9, 'day').format('YYYY-MM-DD HH:mm:ss'),
    transactionId: 'TXN2024010100001',
  },
]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, page = 1, pageSize = 10 } = req.query
  const pageNum = Number(page)
  const size = Number(pageSize)

  let filtered = mockPayouts
  if (status) {
    filtered = mockPayouts.filter((p) => p.status === status)
  }

  const start = (pageNum - 1) * size
  const list = filtered.slice(start, start + size)

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0)

  res.json({
    success: true,
    data: {
      list,
      total: filtered.length,
      page: pageNum,
      pageSize: size,
      summary: {
        totalCount: filtered.length,
        totalAmount,
        pendingCount: filtered.filter((p) => p.status === 'pending').length,
      },
    },
  })
})

router.post('/:id/execute', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const payout = mockPayouts.find((p) => p.id === id) || mockPayouts[0]

  res.json({
    success: true,
    data: {
      id,
      status: 'completed',
      statusText: '已打款',
      paidAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      transactionId: 'TXN' + dayjs().format('YYYYMMDDHHmmss'),
      actualAmount: payout.actualAmount,
    },
  })
})

router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  const { ids } = req.body

  const results = (ids || []).map((id: string) => ({
    id,
    success: true,
    status: 'completed',
    paidAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    transactionId: 'TXN' + dayjs().format('YYYYMMDDHHmmss') + id.slice(-4),
  }))

  res.json({
    success: true,
    data: {
      successCount: results.length,
      failCount: 0,
      results,
      executedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

export default router
