import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'

const router = Router()

router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      today: {
        orders: 128,
        revenue: 685400,
        users: 56,
        avgPrice: 5354,
      },
      week: {
        orders: 856,
        revenue: 4568200,
        users: 342,
        avgPrice: 5336,
      },
      month: {
        orders: 3420,
        revenue: 18234500,
        users: 1280,
        avgPrice: 5332,
      },
      total: {
        orders: 28560,
        revenue: 152340800,
        users: 12450,
      },
      compare: {
        orders: 12.5,
        revenue: 8.3,
        users: 15.2,
      },
      pending: {
        qualityOrders: 23,
        payouts: 18,
        payoutAmount: 125600,
        processorReviews: 5,
      },
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

router.get('/trend', async (req: Request, res: Response): Promise<void> => {
  const { type = 'day', range = '30' } = req.query
  const days = Number(range)

  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day')
    const baseOrders = 100 + Math.random() * 50
    const baseRevenue = 500000 + Math.random() * 200000
    data.push({
      date: date.format('YYYY-MM-DD'),
      orders: Math.round(baseOrders),
      revenue: Math.round(baseRevenue),
      users: Math.round(baseOrders * 0.6),
    })
  }

  res.json({
    success: true,
    data: {
      type,
      range: days,
      list: data,
      summary: {
        totalOrders: data.reduce((sum, d) => sum + d.orders, 0),
        totalRevenue: data.reduce((sum, d) => sum + d.revenue, 0),
        totalUsers: data.reduce((sum, d) => sum + d.users, 0),
        avgOrders: Math.round(data.reduce((sum, d) => sum + d.orders, 0) / data.length),
        avgRevenue: Math.round(data.reduce((sum, d) => sum + d.revenue, 0) / data.length),
      },
    },
  })
})

router.get('/category', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      byQuantity: [
        { category: '手机', count: 15420, percentage: 54.0, color: '#6366f1' },
        { category: '电脑', count: 6820, percentage: 23.9, color: '#8b5cf6' },
        { category: '平板', count: 3420, percentage: 12.0, color: '#a855f7' },
        { category: '智能手表', count: 1780, percentage: 6.2, color: '#d946ef' },
        { category: '其他', count: 1120, percentage: 3.9, color: '#f43f5e' },
      ],
      byRevenue: [
        { category: '手机', revenue: 82340000, percentage: 54.0, color: '#6366f1' },
        { category: '电脑', revenue: 45680000, percentage: 30.0, color: '#8b5cf6' },
        { category: '平板', revenue: 12450000, percentage: 8.2, color: '#a855f7' },
        { category: '智能手表', revenue: 7890000, percentage: 5.2, color: '#d946ef' },
        { category: '其他', revenue: 3980800, percentage: 2.6, color: '#f43f5e' },
      ],
      byCondition: [
        { condition: '99新', count: 8568, percentage: 30.0, color: '#10b981' },
        { condition: '95新', count: 10281, percentage: 36.0, color: '#3b82f6' },
        { condition: '9成新', count: 5712, percentage: 20.0, color: '#f59e0b' },
        { condition: '8成新', count: 2856, percentage: 10.0, color: '#ef4444' },
        { condition: '破损', count: 1143, percentage: 4.0, color: '#6b7280' },
      ],
      total: {
        quantity: 28560,
        revenue: 152340800,
      },
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  })
})

export default router
