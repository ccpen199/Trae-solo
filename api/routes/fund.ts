import { Router, type Response } from 'express'
import { success, fail, notFound } from '../utils/response.js'
import { parsePagination, paginate } from '../utils/pagination.js'
import { type AuthRequest } from '../utils/auth.js'
import { db, type PrepayOrder, type PrepayStatus, type Transaction, type TransactionType, type WithdrawRequest, type WithdrawStatus } from '../mock/data.js'
import { genPrepayNo, genTxNo } from '../mock/data.js'
import { evaluatePrepayRisk } from '../services/riskEngine.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

const router = Router()

router.get('/wallet', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const wallet = db.wallets.find(w => w.userId === user.id)
  if (!wallet) {
    notFound(res, '钱包不存在')
    return
  }

  const recentTransactions = db.transactions
    .filter(t => t.walletId === wallet.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const prepaidPending = db.prepayOrders.filter(p => p.driverId === user.id && (p.status === 'pending' || p.status === 'approved')).reduce((s, p) => s + p.approvedAmount, 0)
  const prepaidDisbursed = db.prepayOrders.filter(p => p.driverId === user.id && p.status === 'disbursed').reduce((s, p) => s + p.disbursedAmount, 0)

  success(res, {
    wallet: {
      id: wallet.id,
      balance: wallet.balance,
      frozenAmount: wallet.frozenAmount,
      availableAmount: Math.max(0, wallet.balance - wallet.frozenAmount),
      availableCredit: wallet.availableCredit,
      usedCredit: wallet.usedCredit,
      creditLine: wallet.availableCredit + wallet.usedCredit,
      totalIncome: wallet.totalIncome,
      totalExpense: wallet.totalExpense,
      lastUpdatedAt: wallet.lastUpdatedAt,
      bankCards: wallet.bankCards || [],
    },
    stats: {
      prepaidPending: parseFloat(prepaidPending.toFixed(2)),
      prepaidDisbursed: parseFloat(prepaidDisbursed.toFixed(2)),
    },
    recentTransactions,
  })
})

router.get('/wallet/transactions', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const wallet = db.wallets.find(w => w.userId === user.id)
  if (!wallet) {
    notFound(res, '钱包不存在')
    return
  }

  const params = parsePagination(req.query as Record<string, unknown>)
  const { type, startDate, endDate } = req.query

  let list = db.transactions.filter(t => t.walletId === wallet.id)

  if (type) {
    const typeList = (type as string).split(',').filter(Boolean) as TransactionType[]
    list = list.filter(t => typeList.includes(t.type))
  }
  if (startDate) {
    const d = new Date(startDate as string).getTime()
    list = list.filter(t => new Date(t.createdAt).getTime() >= d)
  }
  if (endDate) {
    const d = new Date(endDate as string).getTime()
    list = list.filter(t => new Date(t.createdAt).getTime() <= d)
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const pageData = paginate(list, params)

  const totalIncome = list.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalExpense = list.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  success(res, {
    list: pageData.list,
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    summary: {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      netIncome: parseFloat((totalIncome - totalExpense).toFixed(2)),
    },
  })
})

router.post('/prepay/apply', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'driver') {
    fail(res, '仅司机可申请预支', 403, 403)
    return
  }

  const { orderId, amount, remark } = req.body as { orderId?: string; amount?: number; remark?: string }
  if (!orderId) {
    fail(res, '请选择运单')
    return
  }
  if (!amount || amount <= 0) {
    fail(res, '请输入有效金额')
    return
  }

  const order = db.orders.find(o => o.id === orderId || o.orderNo === orderId)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }
  if (order.driverId !== user.id) {
    fail(res, '非本运单司机，无法申请预支', 403, 403)
    return
  }
  if (!['matched', 'loading', 'in_transit'].includes(order.status)) {
    fail(res, `运单状态${order.status}不可申请预支`)
    return
  }
  if (amount > order.prepayMaxAmount) {
    fail(res, `预支金额超过上限${order.prepayMaxAmount}`)
    return
  }

  const existing = db.prepayOrders.find(p => p.orderId === order.id && p.status !== 'rejected' && p.status !== 'settled')
  if (existing) {
    fail(res, `已有预支申请(状态:${existing.status})，不可重复申请`)
    return
  }

  const driverUser = user
  const driverProfile = db.driverProfiles.find(p => p.userId === user.id)!
  const shipperUser = db.users.find(u => u.id === order.shipperId)!
  const shipperProfile = db.shipperProfiles.find(p => p.userId === order.shipperId)!
  const evaluation = evaluatePrepayRisk(order, driverUser, driverProfile, shipperUser, shipperProfile)

  const nowIso = new Date().toISOString()
  const approvedAmount = amount
  const isAuto = evaluation.decision === 'auto_approve'
  const disbursedAmount = isAuto ? approvedAmount : 0
  const status: PrepayStatus = isAuto ? 'disbursed' : 'pending'

  const prepay: PrepayOrder = {
    id: uuidv4(),
    prepayNo: genPrepayNo(),
    orderId: order.id,
    driverId: user.id,
    shipperId: order.shipperId,
    requestedAmount: parseFloat(amount.toFixed(2)),
    approvedAmount: parseFloat(approvedAmount.toFixed(2)),
    disbursedAmount: parseFloat(disbursedAmount.toFixed(2)),
    riskScore: evaluation.riskScore,
    riskLevel: evaluation.riskLevel,
    riskReasons: evaluation.riskReasons,
    status,
    requestedAt: nowIso,
    riskEvaluatedAt: nowIso,
    approvedAt: (isAuto || evaluation.decision === 'manual_review') ? nowIso : undefined,
    disbursedAt: isAuto ? nowIso : undefined,
    remark,
  }
  db.prepayOrders.push(prepay)

  if (isAuto && disbursedAmount > 0) {
    const wallet = db.wallets.find(w => w.userId === user.id)!
    wallet.balance += disbursedAmount
    wallet.usedCredit += disbursedAmount
    wallet.totalIncome += disbursedAmount
    wallet.lastUpdatedAt = nowIso

    db.transactions.push({
      id: uuidv4(),
      walletId: wallet.id,
      userId: wallet.userId,
      type: 'prepay_disbursement',
      amount: disbursedAmount,
      balanceAfter: wallet.balance,
      relatedOrderId: order.id,
      remark: `预支申请放款 ${order.orderNo}`,
      createdAt: nowIso,
    })
  }

  success(res, {
    prepayId: prepay.id,
    prepayNo: prepay.prepayNo,
    status: prepay.status,
    requestedAmount: prepay.requestedAmount,
    approvedAmount: prepay.approvedAmount,
    disbursedAmount: prepay.disbursedAmount,
    riskResult: {
      riskScore: evaluation.riskScore,
      riskLevel: evaluation.riskLevel,
      decision: evaluation.decision,
      suggestion: evaluation.suggestions[0] || '',
    },
  }, `预支申请提交成功，${isAuto ? '风控通过，已自动放款' : evaluation.suggestions[0] || '等待人工复核'}`)
})

router.post('/prepay/:id/approve', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const { id } = req.params
  const prepay = db.prepayOrders.find(p => p.id === id || p.prepayNo === id)
  if (!prepay) {
    notFound(res, '预支申请不存在')
    return
  }

  const isAdmin = user.role === 'admin'
  const isShipper = order => order.shipperId === user.id && user.role === 'shipper'
  const order = db.orders.find(o => o.id === prepay.orderId)!

  if (!isAdmin && !isShipper(order)) {
    fail(res, '无权限审批此预支申请', 403, 403)
    return
  }
  if (prepay.status !== 'pending') {
    fail(res, `预支申请状态${prepay.status}不可审批`)
    return
  }

  const { approved, approvedAmount: overrideAmount, remark } = req.body as { approved?: boolean; approvedAmount?: number; remark?: string }
  const finalApproved = approved ?? true
  const actualApprovedAmount = finalApproved ? parseFloat((overrideAmount ?? prepay.approvedAmount).toFixed(2)) : 0
  const nowIso = new Date().toISOString()

  if (!finalApproved) {
    prepay.status = 'rejected'
    prepay.rejectedAt = nowIso
    prepay.rejectedBy = user.id
    prepay.rejectReason = remark || '风控复核不通过'
    success(res, {
      prepayId: prepay.id,
      status: prepay.status,
    }, '预支申请已拒绝')
    return
  }

  prepay.status = 'disbursed'
  prepay.approvedAmount = actualApprovedAmount
  prepay.disbursedAmount = actualApprovedAmount
  prepay.approvedAt = nowIso
  prepay.disbursedAt = nowIso
  prepay.reviewedBy = user.id
  if (remark) prepay.remark = remark

  const wallet = db.wallets.find(w => w.userId === prepay.driverId)!
  wallet.balance += actualApprovedAmount
  wallet.usedCredit += actualApprovedAmount
  wallet.totalIncome += actualApprovedAmount
  wallet.lastUpdatedAt = nowIso

  db.transactions.push({
    id: uuidv4(),
    walletId: wallet.id,
    userId: wallet.userId,
    type: 'prepay_disbursement',
    amount: actualApprovedAmount,
    balanceAfter: wallet.balance,
    relatedOrderId: order.id,
    remark: `人工复核放款 ${prepay.prepayNo}`,
    createdAt: nowIso,
  })

  success(res, {
    prepayId: prepay.id,
    prepayNo: prepay.prepayNo,
    status: prepay.status,
    approvedAmount: prepay.approvedAmount,
    disbursedAmount: prepay.disbursedAmount,
  }, '预支申请复核通过，已放款')
})

router.post('/withdraw', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const { amount, bankCardId } = req.body as { amount?: number; bankCardId?: string }

  if (!amount || amount <= 0) {
    fail(res, '请输入有效提现金额')
    return
  }
  if (amount < 100) {
    fail(res, '单笔提现金额不低于100元')
    return
  }

  const wallet = db.wallets.find(w => w.userId === user.id)
  if (!wallet) {
    notFound(res, '钱包不存在')
    return
  }

  const availableAmount = Math.max(0, wallet.balance - wallet.frozenAmount)
  if (amount > availableAmount) {
    fail(res, `可用余额不足，当前可用${availableAmount.toFixed(2)}元`)
    return
  }

  const fee = parseFloat((amount * 0.001).toFixed(2))
  const actualAmount = parseFloat((amount - fee).toFixed(2))

  let bankCard = (wallet.bankCards || []).find(c => c.id === bankCardId)
  if (!bankCard) {
    bankCard = (wallet.bankCards || [])[0]
    if (!bankCard) {
      bankCard = {
        id: 'default-card-' + user.id,
        bankName: '中国工商银行',
        cardHolder: user.realName || user.nickname,
        cardNo: '6222****8888',
        isDefault: true,
        createdAt: new Date().toISOString(),
      }
    }
  }

  const nowIso = new Date().toISOString()
  const status: WithdrawStatus = 'processing'

  wallet.balance -= amount
  wallet.frozenAmount += amount
  wallet.totalExpense += amount
  wallet.lastUpdatedAt = nowIso

  const withdraw: WithdrawRequest = {
    id: uuidv4(),
    withdrawNo: 'TX' + Date.now().toString().padStart(8, '0'),
    userId: user.id,
    walletId: wallet.id,
    amount,
    fee,
    actualAmount,
    bankCardId: bankCard.id,
    bankName: bankCard.bankName,
    cardNo: bankCard.cardNo,
    cardHolder: bankCard.cardHolder,
    status,
    requestedAt: nowIso,
    processedAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
  db.withdrawRequests.push(withdraw)

  db.transactions.push({
    id: uuidv4(),
    walletId: wallet.id,
    userId: wallet.userId,
    type: 'withdraw',
    amount: -amount,
    balanceAfter: wallet.balance,
    relatedWithdrawId: withdraw.id,
    remark: `提现申请 ${withdraw.withdrawNo}`,
    createdAt: nowIso,
  })

  setTimeout(() => {
    withdraw.status = 'completed'
    withdraw.completedAt = new Date(Date.now() + 2 * 3600 * 1000).toISOString()
    if (wallet) {
      wallet.frozenAmount = Math.max(0, wallet.frozenAmount - amount)
    }
  }, 100)

  success(res, {
    withdrawId: withdraw.id,
    withdrawNo: withdraw.withdrawNo,
    amount,
    fee,
    actualAmount,
    status: withdraw.status,
    bankCard: {
      bankName: withdraw.bankName,
      cardNo: withdraw.cardNo,
      cardHolder: withdraw.cardHolder,
    },
  }, '提现申请已提交，预计1-2小时到账')
})

router.get('/withdraw/list', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const params = parsePagination(req.query as Record<string, unknown>)
  const { status } = req.query

  let list = db.withdrawRequests.filter(w => w.userId === user.id)
  if (status) {
    list = list.filter(w => w.status === status)
  }
  list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())

  const pageData = paginate(list, params)
  success(res, {
    list: pageData.list,
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
  })
})

export default router
