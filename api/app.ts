/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import paymentRoutes from './routes/payment.js'
import financeRoutes from './routes/finance.js'
import dataRoutes from './routes/data.js'
import merchantRoutes from './routes/merchant.js'
import promotionRoutes from './routes/promotion.js'
import diagnosisRoutes from './routes/diagnosis.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/merchant', merchantRoutes)
app.use('/api/promotion', promotionRoutes)
app.use('/api/diagnosis', diagnosisRoutes)

app.get('/api/search', (req: Request, res: Response) => {
  const keyword = String(req.query.q || '').trim()
  res.json({
    success: true,
    keyword,
    total: 3,
    results: [
      {
        title: '缴费中心',
        type: '缴费',
        path: '/payment',
        summary: '查询账单、去结算、提交订单、确认支付和查看订单记录',
      },
      {
        title: '金融超市',
        type: '金融',
        path: '/finance',
        summary: '按风险等级筛选理财、保险和贷款产品',
      },
      {
        title: '商户分润结算',
        type: '运营',
        path: '/merchant',
        summary: '查看商户账单、清算进度和分润明细',
      },
    ],
  })
})

const currentUser = {
  id: 'U001',
  name: '张明',
  phone: '138****8888',
  role: 'personal',
  authStatus: 'verified',
}

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (_req: Request, res: Response) => {
  res.json({
    success: true,
    user: currentUser,
  })
})

app.get('/api/admin/stats', (_req: Request, res: Response) => {
  res.json({
    success: true,
    todayPayments: 1286,
    activeMerchants: 386,
    failedPayments: 3,
    settlementStatus: 'normal',
  })
})

app.get('/api/admin/dashboard', (_req: Request, res: Response) => {
  res.json({
    success: true,
    modules: ['缴费中心', '金融超市', '数据资产中心', '商户分润结算'],
    alerts: [
      { level: 'warning', title: '3笔缴费待对账', action: '进入缴费诊断知识库' },
      { level: 'info', title: '今日分润批次已生成', action: '查看清算明细' },
    ],
  })
})

app.get('/api/home/overview', (_req: Request, res: Response) => {
  res.json({
    success: true,
    billSummary: {
      totalUnpaid: 7,
      totalAmount: 4408.5,
      overdueCount: 1,
      overdueAmount: 2400,
      processingCount: 1,
      failedCount: 1,
      byCategory: [
        { category: "electricity", name: "电费", count: 1, amount: 286.5, status: "unpaid", canDeduct: true, hasSigned: false },
        { category: "water", name: "水费", count: 1, amount: 68.2, status: "unpaid", canDeduct: true, hasSigned: true },
        { category: "gas", name: "燃气费", count: 1, amount: 145.8, status: "failed", canDeduct: true, hasSigned: true },
        { category: "communication", name: "通讯费", count: 2, amount: 228.0, status: "unpaid", canDeduct: false, hasSigned: false },
        { category: "social", name: "社保", count: 1, amount: 1280.0, status: "processing", canDeduct: true, hasSigned: false },
        { category: "heating", name: "暖气费", count: 1, amount: 2400.0, status: "overdue", canDeduct: false, hasSigned: false },
      ],
      pendingCorrection: 1,
      pendingArbitration: 0,
      pendingInvoices: 3,
    },
    reminderSummary: {
      totalConfigs: 3,
      activeChannels: { sms: true, system: true, wechat: true },
      todaySent: 4,
      todayFailed: 1,
      pendingRetry: 2,
      nextReminderTime: "2026-06-12 09:00",
      channelStats: [
        { channel: "sms", name: "短信", sent: 3, success: 3, failed: 0, rate: "100%" },
        { channel: "system", name: "系统", sent: 4, success: 4, failed: 0, rate: "100%" },
        { channel: "wechat", name: "公众号", sent: 2, success: 1, failed: 1, rate: "50%" },
      ],
    },
    financeSummary: {
      totalAssets: 15820.3,
      totalProfit: 1824.78,
      riskLevel: "R2",
      riskLabel: "稳健型",
      pendingContracts: 1,
      activeProducts: 2,
      loanQuota: 200000,
      supervisingAmount: 10000,
    },
    operationSummary: {
      dataCenter: {
        totalPayments: 1286,
        totalAmount: 458920.5,
        topRegion: "山东省",
        topCategory: "电费",
        growthRate: "+12.4%",
      },
      merchant: {
        settledMerchants: 386,
        pendingSettlement: 12,
        settlementStatus: "normal",
        lastSettleDate: "2026-06-10",
        totalProfitShare: 15680.25,
      },
      promotion: {
        activeCampaigns: 4,
        totalCoupons: 12860,
        usedCoupons: 8925,
        roi: "3.85",
        todayEffect: "+25.6%",
      },
      diagnosis: {
        todayFailures: 3,
        resolvedToday: 2,
        pendingReview: 1,
        autoCorrectionRate: "85%",
        topCause: "支付通道超时",
      },
    },
  });
});

app.get('/api/products', (_req: Request, res: Response) => {
  res.json({
    success: true,
    products: [
      { id: 'FP001', name: '稳利宝30天', type: 'wealth', minAmount: 1000 },
      { id: 'FP002', name: '均衡增利90天', type: 'wealth', minAmount: 5000 },
    ],
  })
})

app.get('/api/orders', (_req: Request, res: Response) => {
  res.json({
    success: true,
    orders: [
      { id: 'PAY2026061000001', type: 'payment', status: 'success', amount: 286.5 },
      { id: 'FI202606110001', type: 'finance', status: 'supervising', amount: 10000 },
    ],
  })
})

app.get('/api/cart', (_req: Request, res: Response) => {
  res.json({
    success: true,
    items: [],
    totalAmount: 0,
  })
})

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
