import { Router, type Request, type Response } from 'express'

const router = Router()

type CardStatus = 'pending_approval' | 'active' | 'rejected' | 'unbound'

const statusLabels: Record<CardStatus, string> = {
  pending_approval: '待审核',
  active: '已激活',
  rejected: '已驳回',
  unbound: '未绑定',
}

interface CardData {
  cardNo: string
  memberName: string
  balance: number
  status: CardStatus
  statusLabel: string
  bindDate: string
  cardType: string
  bankName: string
  appliedAt: string
  approver?: string
  approvedAt?: string
  rejectReason?: string
  permissions: {
    balanceQuery: boolean
    onlinePayment: boolean
    subsidyReceive: boolean
    refund: boolean
    transactionHistory: boolean
  }
  applicant?: string
}

let cardState: CardData = {
  cardNo: '6212********1234',
  memberName: '张三',
  balance: 1280.5,
  status: 'pending_approval',
  statusLabel: statusLabels.pending_approval,
  bindDate: '2024-03-15',
  cardType: '工会服务卡',
  bankName: '中国工商银行',
  appliedAt: '2026-06-08 15:30:00',
  applicant: '张三',
  permissions: {
    balanceQuery: true,
    onlinePayment: false,
    subsidyReceive: false,
    refund: false,
    transactionHistory: false,
  },
}

router.get('/card', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: cardState,
  })
})

router.post('/card/apply', (req: Request, res: Response): void => {
  const { cardNo, bankName, memberName, idLast6 } = req.body
  if (!cardNo || !bankName || !memberName || !idLast6) {
    res.status(400).json({
      success: false,
      message: '参数不完整',
    })
    return
  }
  cardState = {
    ...cardState,
    cardNo: cardNo.replace(/(\d{4})\d+(\d{4})/, '$1********$2'),
    memberName,
    bankName,
    status: 'pending_approval',
    statusLabel: statusLabels.pending_approval,
    appliedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    applicant: memberName,
    approver: undefined,
    approvedAt: undefined,
    rejectReason: undefined,
    permissions: {
      balanceQuery: true,
      onlinePayment: false,
      subsidyReceive: false,
      refund: false,
      transactionHistory: false,
    },
  }
  res.json({
    success: true,
    message: '申请已提交，预计1-3个工作日完成审核',
    data: cardState,
  })
})

router.post('/card/apply-cancel', (_req: Request, res: Response): void => {
  cardState = {
    ...cardState,
    status: 'unbound',
    statusLabel: statusLabels.unbound,
    appliedAt: '',
    applicant: undefined,
    approver: undefined,
    approvedAt: undefined,
    rejectReason: undefined,
    permissions: {
      balanceQuery: false,
      onlinePayment: false,
      subsidyReceive: false,
      refund: false,
      transactionHistory: false,
    },
  }
  res.json({
    success: true,
    message: '申请已撤回',
    data: cardState,
  })
})

router.post('/card/approve', (req: Request, res: Response): void => {
  const { approver } = req.body
  cardState = {
    ...cardState,
    status: 'active',
    statusLabel: statusLabels.active,
    approver: approver || '系统管理员',
    approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    rejectReason: undefined,
    permissions: {
      balanceQuery: true,
      onlinePayment: true,
      subsidyReceive: true,
      refund: true,
      transactionHistory: true,
    },
  }
  res.json({
    success: true,
    message: '卡片已激活',
    data: cardState,
  })
})

router.post('/card/reject', (req: Request, res: Response): void => {
  const { approver, rejectReason } = req.body
  cardState = {
    ...cardState,
    status: 'rejected',
    statusLabel: statusLabels.rejected,
    approver: approver || '系统管理员',
    approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    rejectReason: rejectReason || '信息不符，请核实后重新提交',
    permissions: {
      balanceQuery: true,
      onlinePayment: false,
      subsidyReceive: false,
      refund: false,
      transactionHistory: false,
    },
  }
  res.json({
    success: true,
    message: '申请已驳回',
    data: cardState,
  })
})

router.get('/transactions', (req: Request, res: Response): void => {
  const { type, startDate, endDate, status } = req.query

  const allTransactions = [
    { id: 'txn-1', type: 'voucher_redeem', amount: -500.00, description: '春节慰问金核销', merchant: 'XX超市', date: '2025-02-05 14:30:00', balance: 1280.50, status: 'success' },
    { id: 'txn-2', type: 'points_exchange', amount: 0, description: '积分兑换-品牌保温杯', merchant: '积分商城', date: '2025-01-28 10:15:00', balance: 1780.50, status: 'success' },
    { id: 'txn-3', type: 'voucher_redeem', amount: -300.00, description: '五一劳动节福利核销', merchant: 'XX百货', date: '2025-05-01 11:20:00', balance: 1780.50, status: 'success' },
    { id: 'txn-4', type: 'subsidy', amount: 1000.00, description: '困难职工帮扶金到账', merchant: '工会补贴', date: '2025-03-05 09:00:00', balance: 2080.50, status: 'success' },
    { id: 'txn-5', type: 'payment', amount: -89.00, description: '体检套餐支付', merchant: 'XX健康体检中心', date: '2025-04-10 16:45:00', balance: 1991.50, status: 'success' },
    { id: 'txn-6', type: 'refund', amount: 200.00, description: '贵宾厅预约取消退款', merchant: '机场服务', date: '2025-05-20 08:30:00', balance: 1280.50, status: 'pending' },
    { id: 'txn-7', type: 'subsidy', amount: 500.00, description: '春节慰问金发放', merchant: '工会补贴', date: '2025-01-20 10:00:00', balance: 2280.50, status: 'success' },
    { id: 'txn-8', type: 'payment', amount: -45.00, description: '法律咨询服务费', merchant: '正义律师事务所', date: '2025-06-01 14:00:00', balance: 1325.50, status: 'failed' },
  ]

  let filtered = allTransactions
  if (type) {
    filtered = filtered.filter(t => t.type === type)
  }
  if (startDate) {
    filtered = filtered.filter(t => t.date >= (startDate as string))
  }
  if (endDate) {
    filtered = filtered.filter(t => t.date <= (endDate as string))
  }
  if (status) {
    filtered = filtered.filter(t => t.status === status)
  }

  res.json({ success: true, data: filtered })
})

router.get('/unionpay/status', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      integrationStatus: 'connected',
      lastHeartbeat: new Date().toISOString().replace('T', ' ').slice(0, 19),
      apiVersion: 'v2.1',
      supportedFeatures: ['query_balance', 'payment', 'refund', 'transaction_history'],
      dailyLimit: 50000,
      todayUsage: 3589.00,
      connectionQuality: 'excellent',
    },
  })
})

export default router
